import { z } from 'zod'
import type { ReportDefinition, ReportExecutionContext } from './types'
import { GithubApiService } from '@/lib/github-api'
import { JiraApiService } from '@/lib/jira-api'
import {
  COMPLETED_STATUSES,
  ACTIVE_STATUSES,
  type TaskStatus,
} from '@/lib/task-status'

export const personOverviewInput = z.object({
  personId: z.string(),
  fromDate: z.string(),
  toDate: z.string(),
  includeFeedback: z.boolean().optional().default(false),
})

type Output = {
  person: { id: string; name: string }
  period: { fromDate: string; toDate: string }
  metrics: {
    completedTasksCount: number
    initiativesCount: number
    activeJiraTicketsCount: number
    activePrsCount: number
  }
  completedTasks: Array<{
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
    summary: string | null
    status: string
    openTasks: Array<{
      id: string
      title: string
      status: string
      updatedAt?: string | null
      completedAt?: string | null
      initiativeId?: string | null
    }>
    completedTasks: Array<{
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
  codeId: 'person-overview',
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

    const fromDate = new Date(input.fromDate)
    const toDate = new Date(input.toDate)

    // Calculate one week ago for Jira tickets
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Fetch all completed tasks for the person in the time period
    const allCompletedTasks = await ctx.prisma.task.findMany({
      where: {
        assigneeId: person.id,
        status: { in: COMPLETED_STATUSES },
        completedAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        completedAt: true,
        initiativeId: true,
      },
    })

    // Fetch all initiatives the person is involved in (as owner or through tasks)
    const initiatives = await ctx.prisma.initiative.findMany({
      where: {
        organizationId: ctx.user.organizationId,
        OR: [
          { owners: { some: { personId: person.id } } },
          {
            tasks: {
              some: {
                assigneeId: person.id,
                OR: [
                  {
                    updatedAt: {
                      gte: fromDate,
                      lte: toDate,
                    },
                  },
                  {
                    completedAt: {
                      gte: fromDate,
                      lte: toDate,
                    },
                  },
                  {
                    status: { in: ACTIVE_STATUSES },
                  },
                ],
              },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        summary: true,
        status: true,
        tasks: {
          where: {
            assigneeId: person.id,
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

    // Separate tasks for each initiative into open and completed
    const initiativesWithTasks = initiatives.map(init => {
      const openTasks = init.tasks.filter(
        t => !COMPLETED_STATUSES.includes(t.status as TaskStatus)
      )
      const completedTasksInPeriod = init.tasks.filter(
        t =>
          COMPLETED_STATUSES.includes(t.status as TaskStatus) &&
          t.completedAt &&
          new Date(t.completedAt) >= fromDate &&
          new Date(t.completedAt) <= toDate
      )

      return {
        id: init.id,
        title: init.title,
        summary: init.summary,
        status: init.status,
        openTasks: openTasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          updatedAt: t.updatedAt?.toISOString() ?? null,
          completedAt: t.completedAt?.toISOString() ?? null,
          initiativeId: t.initiativeId,
        })),
        completedTasks: completedTasksInPeriod.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          updatedAt: t.updatedAt?.toISOString() ?? null,
          completedAt: t.completedAt?.toISOString() ?? null,
          initiativeId: t.initiativeId,
        })),
      }
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

          // Fetch PRs from a wider date range to catch all relevant ones
          const widerDaysBack = Math.max(
            daysBack,
            Math.ceil(
              (toDate.getTime() - oneWeekAgo.getTime()) / (1000 * 60 * 60 * 24)
            )
          )

          const pullRequests = await githubService.getRecentPullRequests(
            person.githubAccount.githubUsername,
            widerDaysBack
          )

          // Filter for completed (merged) OR in progress (open) PRs
          githubPrs = pullRequests
            .filter(pr => {
              const state = pr.state.toLowerCase()
              const isCompleted = state === 'merged' || state === 'closed'
              const isInProgress = state === 'open'

              // Include if in progress OR completed
              if (isInProgress) return true
              if (isCompleted) {
                // Include merged PRs if they were merged in the time period or recently
                if (pr.mergedAt) {
                  const mergedDate = new Date(pr.mergedAt)
                  return mergedDate >= oneWeekAgo
                }
                return true
              }
              return false
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

          // Get tickets from a wider date range to catch recently completed ones
          const fromDateStr = oneWeekAgo.toISOString().split('T')[0]
          const toDateStr = toDate.toISOString().split('T')[0]

          const assignedTickets = await jiraService.getUserAssignedTickets(
            person.jiraAccount.jiraAccountId,
            fromDateStr,
            toDateStr
          )

          // Filter for active tickets OR tickets updated/completed in the last week
          jiraTickets = assignedTickets
            .filter(ticket => {
              const status = ticket.issue.fields.status.name.toLowerCase()
              const isCompleted =
                status.includes('done') || status.includes('closed')
              const lastUpdated = new Date(ticket.lastUpdated)

              // Include if active OR (completed and updated in last week - likely just completed)
              if (!isCompleted) return true
              if (isCompleted && lastUpdated >= oneWeekAgo) return true
              return false
            })
            .map(ticket => ({
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

    // Calculate metrics
    const completedTasksCount = allCompletedTasks.length
    const initiativesCount = initiatives.length
    // Count all Jira tickets (already filtered to active OR completed in last week)
    const activeJiraTicketsCount = jiraTickets.length
    // Count all PRs (already filtered to in progress OR completed)
    const activePrsCount = githubPrs.length

    const output: Output = {
      person: { id: person.id, name: person.name },
      period: { fromDate: input.fromDate, toDate: input.toDate },
      metrics: {
        completedTasksCount,
        initiativesCount,
        activeJiraTicketsCount,
        activePrsCount,
      },
      completedTasks: allCompletedTasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        updatedAt: t.updatedAt?.toISOString() ?? null,
        completedAt: t.completedAt?.toISOString() ?? null,
        initiativeId: t.initiativeId,
      })),
      initiatives: initiativesWithTasks,
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

  // Metrics section
  if (obj.metrics && typeof obj.metrics === 'object') {
    const metrics = obj.metrics as Record<string, unknown>
    sections.push('## Metrics\n')
    sections.push(`- **Completed Tasks:** ${metrics.completedTasksCount || 0}`)
    sections.push(
      `- **Initiatives Involved:** ${metrics.initiativesCount || 0}`
    )
    sections.push(
      `- **Active Jira Tickets:** ${metrics.activeJiraTicketsCount || 0}`
    )
    sections.push(`- **Active PRs:** ${metrics.activePrsCount || 0}\n`)
  }

  // Completed Tasks section
  if (obj.completedTasks && Array.isArray(obj.completedTasks)) {
    sections.push('## Completed Tasks')

    if (obj.completedTasks.length === 0) {
      sections.push('\n_No completed tasks found_\n')
    } else {
      for (const task of obj.completedTasks) {
        if (typeof task === 'object' && task !== null) {
          const taskObj = task as Record<string, unknown>
          const completedAt = taskObj.completedAt
            ? ` (${formatDate(taskObj.completedAt as string)})`
            : ''
          sections.push(`\n- ✅ **${taskObj.title}**${completedAt}`)
        }
      }
      sections.push('\n')
    }
  }

  // Initiatives section with cards
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

          sections.push(`\n### ${statusIcon} ${initObj.title}`)

          // Show summary/description if available
          if (initObj.summary && String(initObj.summary).trim()) {
            sections.push(`\n${String(initObj.summary).trim()}\n`)
          }

          // Show open tasks
          if (
            initObj.openTasks &&
            Array.isArray(initObj.openTasks) &&
            initObj.openTasks.length > 0
          ) {
            sections.push('\n**Open Tasks:**')
            for (const task of initObj.openTasks) {
              if (typeof task === 'object' && task !== null) {
                const taskObj = task as Record<string, unknown>
                const taskStatus = String(taskObj.status || '').toLowerCase()
                const taskStatusIcon = taskStatus.includes('doing')
                  ? '🔄'
                  : taskStatus.includes('blocked')
                    ? '🚫'
                    : '📋'
                sections.push(`  - ${taskStatusIcon} ${taskObj.title}`)
              }
            }
          }

          // Show completed tasks in period
          if (
            initObj.completedTasks &&
            Array.isArray(initObj.completedTasks) &&
            initObj.completedTasks.length > 0
          ) {
            sections.push('\n**Completed Tasks (this period):**')
            for (const task of initObj.completedTasks) {
              if (typeof task === 'object' && task !== null) {
                const taskObj = task as Record<string, unknown>
                const completedAt = taskObj.completedAt
                  ? ` (${formatDate(taskObj.completedAt as string)})`
                  : ''
                sections.push(`  - ✅ ${taskObj.title}${completedAt}`)
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
