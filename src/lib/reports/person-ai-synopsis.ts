import { z } from 'zod'
import type { ReportDefinition, ReportExecutionContext } from './types'
import { generateText } from '@/lib/ai'
import { GithubApiService } from '@/lib/github-api'
import { JiraApiService } from '@/lib/jira-api'

export const personAiSynopsisInput = z.object({
  personId: z.string(),
  fromDate: z.string(),
  toDate: z.string(),
  includeFeedback: z.boolean().default(false),
})

type Output = {
  person: { id: string; name: string; role: string | null }
  period: { fromDate: string; toDate: string }
  synopsis: string
  sources: string[]
  dataSummary: {
    taskCount: number
    initiativeCount: number
    githubPrCount: number
    jiraTicketCount: number
    feedbackCount: number
  }
}

export const PersonAiSynopsisReport: ReportDefinition<
  typeof personAiSynopsisInput,
  Output
> = {
  codeId: 'person-ai-synopsis',
  name: 'Person AI Synopsis',
  description:
    "AI-generated synopsis of a person's work activity over a specific time period",
  supportedRenderers: ['markdown'],
  inputSchema: personAiSynopsisInput,
  identifierFields: [
    {
      fieldName: 'personId',
      displayName: 'Person',
      resolveToName: async (personId: string, ctx: ReportExecutionContext) => {
        const person = await ctx.prisma.person.findFirst({
          where: { id: personId, organizationId: ctx.user.organizationId },
          select: { name: true },
        })
        return person?.name || `Unknown Person (${personId})`
      },
    },
  ],
  authorize: async (ctx, input) => {
    if (!ctx.user.organizationId) {
      throw new Error('User must belong to an organization to run reports')
    }

    const person = await ctx.prisma.person.findFirst({
      where: { id: input.personId, organizationId: ctx.user.organizationId },
      select: { id: true },
    })
    if (!person) throw new Error('Person not found or access denied')

    const isOwn = ctx.user.personId === input.personId
    const isAdmin = ctx.user.role === 'ADMIN' || ctx.user.role === 'OWNER'
    if (!isOwn && !isAdmin) {
      throw new Error(
        'You can only generate synopses for your own person record or you must be an organization admin or owner'
      )
    }
  },
  execute: async (ctx, input) => {
    const person = await ctx.prisma.person.findFirst({
      where: { id: input.personId, organizationId: ctx.user.organizationId },
      select: {
        id: true,
        name: true,
        role: true,
        githubAccount: true,
        jiraAccount: true,
      },
    })
    if (!person) throw new Error('Person not found')

    // Get tasks for the person in the date range
    const tasks = await ctx.prisma.task.findMany({
      where: {
        assigneeId: person.id,
        OR: [
          {
            updatedAt: {
              gte: new Date(input.fromDate),
              lte: new Date(input.toDate),
            },
          },
          {
            completedAt: {
              gte: new Date(input.fromDate),
              lte: new Date(input.toDate),
            },
          },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        updatedAt: true,
        completedAt: true,
        initiativeId: true,
        objectiveId: true,
      },
    })

    // Get initiatives the person is involved in
    const initiatives = await ctx.prisma.initiative.findMany({
      where: {
        organizationId: ctx.user.organizationId,
        OR: [
          {
            owners: {
              some: {
                personId: person.id,
              },
            },
          },
          {
            tasks: {
              some: {
                assigneeId: person.id,
                OR: [
                  {
                    updatedAt: {
                      gte: new Date(input.fromDate),
                      lte: new Date(input.toDate),
                    },
                  },
                  {
                    completedAt: {
                      gte: new Date(input.fromDate),
                      lte: new Date(input.toDate),
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      include: {
        tasks: {
          where: {
            assigneeId: person.id,
            OR: [
              {
                updatedAt: {
                  gte: new Date(input.fromDate),
                  lte: new Date(input.toDate),
                },
              },
              {
                completedAt: {
                  gte: new Date(input.fromDate),
                  lte: new Date(input.toDate),
                },
              },
            ],
          },
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            updatedAt: true,
            completedAt: true,
            initiativeId: true,
            objectiveId: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Get GitHub PRs if person has GitHub account
    let githubPrs: Array<{
      title: string
      repo: string
      state: string
      mergedAt: string | null
      createdAt: string
      updatedAt: string
    }> = []

    if (person.githubAccount) {
      try {
        const creds = await ctx.prisma.userGithubCredentials.findUnique({
          where: { userId: ctx.user.id },
        })
        if (creds) {
          const github = GithubApiService.fromEncryptedCredentials(
            creds.githubUsername,
            creds.encryptedPat
          )

          // Calculate days back from the date range
          const fromDate = new Date(input.fromDate)
          const toDate = new Date(input.toDate)
          const daysBack = Math.max(
            1,
            Math.ceil(
              (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          )

          const pullRequests = await github.getRecentPullRequests(
            person.githubAccount.githubUsername,
            daysBack
          )

          githubPrs = pullRequests
            .filter(pr => {
              const prDate = new Date(pr.createdAt)
              return prDate >= fromDate && prDate <= toDate
            })
            .map(pr => ({
              title: pr.title,
              repo: pr.repository.fullName,
              state: pr.state,
              mergedAt: pr.mergedAt,
              createdAt: pr.createdAt,
              updatedAt: pr.updatedAt,
            }))
        }
      } catch (error) {
        // Continue without GitHub data
        console.warn('Failed to fetch GitHub data:', error)
      }
    }

    // Get Jira tickets if person has Jira account
    let jiraTickets: Array<{
      key: string
      title: string
      status: string
      project: string
    }> = []

    if (person.jiraAccount) {
      try {
        const creds = await ctx.prisma.userJiraCredentials.findUnique({
          where: { userId: ctx.user.id },
        })
        if (creds) {
          const jira = JiraApiService.fromEncryptedCredentials(
            creds.jiraUsername,
            creds.encryptedApiKey,
            creds.jiraBaseUrl
          )
          const tickets = await jira.getUserAssignedTickets(
            person.jiraAccount.jiraAccountId,
            input.fromDate.split('T')[0],
            input.toDate.split('T')[0]
          )
          jiraTickets = tickets.map(t => ({
            key: t.issue.key,
            title: t.issue.fields.summary,
            status: t.issue.fields.status.name,
            project: t.issue.fields.project.key,
          }))
        }
      } catch (error) {
        // Continue without Jira data
        console.warn('Failed to fetch Jira data:', error)
      }
    }

    // Get feedback if requested
    let feedbackNotes: Array<{
      kind: string
      body: string
      createdAt: string
      isPrivate: boolean
    }> = []

    let campaignSummaries: Array<{
      name: string
      startDate: string
      endDate: string
      responseCount: number
    }> = []

    if (input.includeFeedback) {
      // Get current person ID from session for access control
      const currentPersonId = ctx.user.personId

      const feedback = await ctx.prisma.feedback.findMany({
        where: {
          aboutId: person.id,
          createdAt: {
            gte: new Date(input.fromDate),
            lte: new Date(input.toDate),
          },
          OR: [
            { isPrivate: false },
            currentPersonId
              ? { AND: [{ isPrivate: true }, { fromId: currentPersonId }] }
              : { id: { equals: '' } }, // no private feedback if no current person
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          kind: true,
          body: true,
          createdAt: true,
          isPrivate: true,
        },
      })

      feedbackNotes = feedback.map(f => ({
        kind: f.kind,
        body: f.body,
        createdAt: f.createdAt.toISOString(),
        isPrivate: f.isPrivate,
      }))

      const campaigns = await ctx.prisma.feedbackCampaign.findMany({
        where: {
          userId: ctx.user.id,
          targetPersonId: person.id,
          endDate: { gte: new Date(input.fromDate) },
          startDate: { lte: new Date(input.toDate) },
        },
        include: {
          responses: true,
        },
      })

      campaignSummaries = campaigns.map(c => ({
        name: c.name || 'Unnamed Campaign',
        startDate: c.startDate.toISOString(),
        endDate: c.endDate.toISOString(),
        responseCount: c.responses.length,
      }))
    }

    // Determine data sources used
    const sources: string[] = []
    if (tasks.length > 0) sources.push('tasks')
    if (initiatives.length > 0) sources.push('initiatives')
    if (githubPrs.length > 0) sources.push('github')
    if (jiraTickets.length > 0) sources.push('jira')
    if (
      input.includeFeedback &&
      (feedbackNotes.length > 0 || campaignSummaries.length > 0)
    ) {
      sources.push('feedback')
    }

    // Generate AI synopsis
    const system =
      'You write concise professional work synopses for managers. Use prose in most cases in order to give a more conversational tone.  In some cases, when there are several tasks, you can use bullets for efficiency.  Use specific outcomes and metrics when available. Avoid jargon. If information is sparse, state high-level focus. Do not fabricate.'

    const payload = {
      person: { id: person.id, name: person.name, role: person.role },
      period: { fromDate: input.fromDate, toDate: input.toDate },
      tasks: tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        updatedAt: t.updatedAt?.toISOString() ?? null,
        completedAt: t.completedAt?.toISOString() ?? null,
        initiative: t.initiativeId,
        objective: t.objectiveId,
      })),
      initiatives: initiatives.map(init => ({
        title: init.title,
        status: init.status,
        taskCount: init.tasks?.length || 0,
      })),
      githubPrs,
      jiraTickets,
      feedbackNotes,
      campaignSummaries,
    }

    const prompt = `Create a concise synopsis of ${person.name}'s work between ${input.fromDate} and ${input.toDate}. Include initiatives when found, then detail tasks, and include GitHub/Jira if present${input.includeFeedback ? ' and include feedback highlights' : ''}. Use bullet points for clarity. Data:\n\n${JSON.stringify(payload, null, 2)}`

    const synopsis = await generateText({
      system,
      prompt,
      temperature: 0.2,
      maxTokens: 350,
    })

    const output: Output = {
      person: { id: person.id, name: person.name, role: person.role },
      period: { fromDate: input.fromDate, toDate: input.toDate },
      synopsis,
      sources,
      dataSummary: {
        taskCount: tasks.length,
        initiativeCount: initiatives.length,
        githubPrCount: githubPrs.length,
        jiraTicketCount: jiraTickets.length,
        feedbackCount: feedbackNotes.length,
      },
    }

    return output
  },
  renderers: {
    markdown: async output => {
      return await renderMarkdownFromJson(output)
    },
  },
}

async function renderMarkdownFromJson(output: Output): Promise<string> {
  const { person, period, synopsis, sources, dataSummary } = output

  let markdown = `# AI Synopsis Report: ${person.name}\n\n`
  markdown += `**Period:** ${new Date(period.fromDate).toLocaleDateString()} - ${new Date(period.toDate).toLocaleDateString()}\n\n`

  if (person.role) {
    markdown += `**Role:** ${person.role}\n\n`
  }

  markdown += `## Synopsis\n\n${synopsis}\n\n`

  markdown += `## Data Sources\n\n`
  markdown += `This synopsis was generated using data from: ${sources.join(', ')}\n\n`

  markdown += `## Data Summary\n\n`
  markdown += `- **Tasks:** ${dataSummary.taskCount}\n`
  markdown += `- **Initiatives:** ${dataSummary.initiativeCount}\n`
  markdown += `- **GitHub Pull Requests:** ${dataSummary.githubPrCount}\n`
  markdown += `- **Jira Tickets:** ${dataSummary.jiraTicketCount}\n`
  if (dataSummary.feedbackCount > 0) {
    markdown += `- **Feedback Items:** ${dataSummary.feedbackCount}\n`
  }

  markdown += `\n---\n`
  markdown += `*Report generated on ${new Date().toLocaleString()}*\n`

  return markdown
}
