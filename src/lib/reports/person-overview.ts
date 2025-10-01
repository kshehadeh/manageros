import { z } from 'zod'
import type { ReportDefinition, ReportExecutionContext } from './types'
import { GithubApiService } from '@/lib/github-api'
import { JiraApiService } from '@/lib/jira-api'

export const personOverviewInput = z.object({
  personId: z.string(),
  fromDate: z.string(),
  toDate: z.string(),
  includeFeedback: z.boolean().optional().default(false),
})

type Output = {
  person: { id: string; name: string }
  period: { fromDate: string; toDate: string }
  tasks: Array<{
    id: string
    title: string
    status: string
    updatedAt?: string | null
    completedAt?: string | null
    initiativeId?: string | null
  }>
  initiatives: Array<{
    id: string
    title: string
    status: string
    tasks: Array<{
      id: string
      title: string
      status: string
      updatedAt?: string | null
      completedAt?: string | null
      initiativeId?: string | null
    }>
  }>
  githubPrs?: Array<{
    title: string
    repo: string
    state: string
    mergedAt?: string | null
    createdAt: string
    updatedAt: string
  }>
  jiraTickets?: Array<{
    key: string
    title: string
    status: string
    project: string
    issueType: string
    priority?: string
    lastUpdated: string
    created: string
  }>
  feedbackNotes?: Array<{ kind: string; createdAt: string; isPrivate: boolean }>
}

export const PersonOverviewReport: ReportDefinition<
  typeof personOverviewInput,
  Output
> = {
  codeId: 'person_overview',
  name: 'Person Overview',
  description: "Overview of a person's activity between two dates",
  supportedRenderers: ['markdown'],
  inputSchema: personOverviewInput,
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
    const isAdmin = ctx.user.role === 'ADMIN'
    if (!isOwn && !isAdmin) {
      throw new Error(
        'You can only run this report for yourself or be an org admin'
      )
    }
  },
  execute: async (ctx, input) => {
    const person = await ctx.prisma.person.findFirst({
      where: { id: input.personId, organizationId: ctx.user.organizationId },
      select: {
        id: true,
        name: true,
        githubAccount: true,
        jiraAccount: true,
      },
    })
    if (!person) throw new Error('Person not found')

    const tasks = await ctx.prisma.task.findMany({
      where: {
        assigneeId: person.id,
        initiativeId: null, // Exclude tasks associated with initiatives
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
        updatedAt: true,
        completedAt: true,
        initiativeId: true,
      },
    })

    const initiatives = await ctx.prisma.initiative.findMany({
      where: {
        organizationId: ctx.user.organizationId,
        owners: { some: { personId: person.id } },
      },
      select: {
        id: true,
        title: true,
        status: true,
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
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            completedAt: true,
            initiativeId: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    })

    // Fetch GitHub activity if person has linked GitHub account
    let githubPrs: Array<{
      title: string
      repo: string
      state: string
      mergedAt?: string | null
      createdAt: string
      updatedAt: string
    }> = []
    if (person.githubAccount) {
      try {
        const userCredentials =
          await ctx.prisma.userGithubCredentials.findUnique({
            where: { userId: ctx.user.id },
          })

        if (userCredentials) {
          const githubService = GithubApiService.fromEncryptedCredentials(
            userCredentials.githubUsername,
            userCredentials.encryptedPat
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

          const pullRequests = await githubService.getRecentPullRequests(
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
        console.error('Failed to fetch GitHub activity:', error)
        // Continue without GitHub data
      }
    }

    // Fetch Jira activity if person has linked Jira account
    let jiraTickets: Array<{
      key: string
      title: string
      status: string
      project: string
      issueType: string
      priority?: string
      lastUpdated: string
      created: string
    }> = []
    if (person.jiraAccount) {
      try {
        const userCredentials = await ctx.prisma.userJiraCredentials.findUnique(
          {
            where: { userId: ctx.user.id },
          }
        )

        if (userCredentials) {
          const jiraService = JiraApiService.fromEncryptedCredentials(
            userCredentials.jiraUsername,
            userCredentials.encryptedApiKey,
            userCredentials.jiraBaseUrl
          )

          const assignedTickets = await jiraService.getUserAssignedTickets(
            person.jiraAccount.jiraAccountId,
            input.fromDate,
            input.toDate
          )

          jiraTickets = assignedTickets.map(ticket => ({
            key: ticket.issue.key,
            title: ticket.issue.fields.summary,
            status: ticket.issue.fields.status.name,
            project: ticket.issue.fields.project.key,
            issueType: ticket.issue.fields.issuetype.name,
            priority: ticket.issue.fields.priority?.name,
            lastUpdated: ticket.lastUpdated,
            created: ticket.created,
          }))
        }
      } catch (error) {
        console.error('Failed to fetch Jira activity:', error)
        // Continue without Jira data
      }
    }

    const output: Output = {
      person: { id: person.id, name: person.name },
      period: { fromDate: input.fromDate, toDate: input.toDate },
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        updatedAt: t.updatedAt?.toISOString() ?? null,
        completedAt: t.completedAt?.toISOString() ?? null,
        initiativeId: t.initiativeId,
      })),
      initiatives: initiatives.map(init => ({
        id: init.id,
        title: init.title,
        status: init.status,
        tasks: init.tasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          updatedAt: t.updatedAt?.toISOString() ?? null,
          completedAt: t.completedAt?.toISOString() ?? null,
          initiativeId: t.initiativeId,
        })),
      })),
      ...(githubPrs.length > 0 && { githubPrs }),
      ...(jiraTickets.length > 0 && { jiraTickets }),
    }

    return output
  },
  renderers: {
    markdown: async output => {
      return await renderMarkdownFromJson(output)
    },
  },
}

async function renderMarkdownFromJson(json: unknown): Promise<string> {
  if (json === null) return '# Report\n\n_No content_'
  if (typeof json !== 'object') return `# Report\n\n${String(json)}`

  const obj = json as Record<string, unknown>
  const sections: string[] = []

  // Person name at the top
  if (obj.person && typeof obj.person === 'object') {
    const person = obj.person as Record<string, unknown>
    if (person.name) {
      sections.push(`# ${person.name}`)
    }
  }

  // Time period
  if (obj.period && typeof obj.period === 'object') {
    const period = obj.period as Record<string, unknown>
    if (period.fromDate && period.toDate) {
      const fromDate = formatDate(period.fromDate as string)
      const toDate = formatDate(period.toDate as string)
      sections.push(`**Period:** ${fromDate} → ${toDate}\n`)
    }
  }

  // Tasks section - completed first
  if (obj.tasks && Array.isArray(obj.tasks)) {
    sections.push('## Tasks')

    if (obj.tasks.length === 0) {
      sections.push('\n_No tasks found_\n')
    } else {
      // Separate completed and incomplete tasks
      const completedTasks = obj.tasks.filter(
        task =>
          typeof task === 'object' &&
          task !== null &&
          (task as Record<string, unknown>).status &&
          (String((task as Record<string, unknown>).status)
            .toLowerCase()
            .includes('completed') ||
            String((task as Record<string, unknown>).status)
              .toLowerCase()
              .includes('done'))
      )

      const incompleteTasks = obj.tasks.filter(
        task =>
          typeof task === 'object' &&
          task !== null &&
          (task as Record<string, unknown>).status &&
          !String((task as Record<string, unknown>).status)
            .toLowerCase()
            .includes('completed') &&
          !String((task as Record<string, unknown>).status)
            .toLowerCase()
            .includes('done')
      )

      // Render completed tasks first
      if (completedTasks.length > 0) {
        sections.push('\n### Completed')
        for (const task of completedTasks) {
          if (typeof task === 'object' && task !== null) {
            const taskObj = task as Record<string, unknown>
            const completedAt = taskObj.completedAt
              ? ` (${formatDate(taskObj.completedAt as string)})`
              : ''
            sections.push(`\n- ✅ **${taskObj.title}**${completedAt}`)
          }
        }
      }

      // Render incomplete tasks
      if (incompleteTasks.length > 0) {
        sections.push('\n### In Progress')
        for (const task of incompleteTasks) {
          if (typeof task === 'object' && task !== null) {
            const taskObj = task as Record<string, unknown>
            const status = taskObj.status as string
            const statusIcon = status.toLowerCase().includes('in progress')
              ? '🔄'
              : '📋'
            sections.push(`\n- ${statusIcon} **${taskObj.title}**`)
          }
        }
      }
      sections.push('\n')
    }
  }

  // Initiatives section
  if (obj.initiatives && Array.isArray(obj.initiatives)) {
    sections.push('## Initiatives')

    if (obj.initiatives.length === 0) {
      sections.push('\n_No initiatives found_\n')
    } else {
      for (const initiative of obj.initiatives) {
        if (typeof initiative === 'object' && initiative !== null) {
          const initObj = initiative as Record<string, unknown>
          const status = initObj.status as string
          const statusIcon =
            status.toLowerCase().includes('completed') ||
            status.toLowerCase().includes('done')
              ? '✅'
              : status.toLowerCase().includes('in progress')
                ? '🔄'
                : '📋'
          sections.push(`\n- ${statusIcon} **${initObj.title}**`)

          // Show tasks associated with this initiative
          if (
            initObj.tasks &&
            Array.isArray(initObj.tasks) &&
            initObj.tasks.length > 0
          ) {
            const tasks = initObj.tasks as Array<Record<string, unknown>>

            // Separate completed and incomplete tasks
            const completedTasks = tasks.filter(
              task =>
                task.status &&
                (String(task.status).toLowerCase().includes('completed') ||
                  String(task.status).toLowerCase().includes('done'))
            )

            const incompleteTasks = tasks.filter(
              task =>
                task.status &&
                !String(task.status).toLowerCase().includes('completed') &&
                !String(task.status).toLowerCase().includes('done')
            )

            // Render completed tasks first
            if (completedTasks.length > 0) {
              sections.push('\n  - **Completed Tasks:**')
              for (const task of completedTasks) {
                const completedAt = task.completedAt
                  ? ` (${formatDate(task.completedAt as string)})`
                  : ''
                sections.push(`    - ✅ ${task.title}${completedAt}`)
              }
            }

            // Render incomplete tasks
            if (incompleteTasks.length > 0) {
              sections.push('\n  - **In Progress Tasks:**')
              for (const task of incompleteTasks) {
                const taskStatus = task.status as string
                const taskStatusIcon = taskStatus
                  .toLowerCase()
                  .includes('in progress')
                  ? '🔄'
                  : '📋'
                sections.push(`    - ${taskStatusIcon} ${task.title}`)
              }
            }
          }
        }
      }
      sections.push('\n')
    }
  }

  // GitHub PRs section
  if (obj.githubPrs && Array.isArray(obj.githubPrs)) {
    sections.push('## GitHub Pull Requests')

    if (obj.githubPrs.length === 0) {
      sections.push('\n_No pull requests found_\n')
    } else {
      for (const pr of obj.githubPrs) {
        if (typeof pr === 'object' && pr !== null) {
          const prObj = pr as Record<string, unknown>
          const state = prObj.state as string
          const stateIcon =
            state === 'merged' ? '✅' : state === 'closed' ? '❌' : '🔄'
          const mergedAt = prObj.mergedAt
            ? ` (merged: ${formatDate(prObj.mergedAt as string)})`
            : ''
          sections.push(
            `\n- ${stateIcon} **${prObj.title}** in \`${prObj.repo}\`${mergedAt}`
          )
        }
      }
      sections.push('\n')
    }
  }

  // Jira tickets section
  if (obj.jiraTickets && Array.isArray(obj.jiraTickets)) {
    sections.push('## Jira Tickets')

    if (obj.jiraTickets.length === 0) {
      sections.push('\n_No tickets found_\n')
    } else {
      for (const ticket of obj.jiraTickets) {
        if (typeof ticket === 'object' && ticket !== null) {
          const ticketObj = ticket as Record<string, unknown>
          const status = ticketObj.status as string
          const statusIcon =
            status.toLowerCase().includes('done') ||
            status.toLowerCase().includes('closed')
              ? '✅'
              : status.toLowerCase().includes('in progress')
                ? '🔄'
                : '📋'
          const priority = ticketObj.priority ? ` (${ticketObj.priority})` : ''
          sections.push(
            `\n- ${statusIcon} **${ticketObj.key}**: ${ticketObj.title}${priority}`
          )
        }
      }
      sections.push('\n')
    }
  }

  function formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return sections.join('\n')
}
