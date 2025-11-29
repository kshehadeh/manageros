'use server'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'
import { generateText } from '@/lib/ai'
import { getPersonForOverview } from './person'
import { checkIfManagerOrSelf } from '@/lib/utils/people-utils'
import { fetchJiraAssignedTickets } from './jira'
import { fetchGithubPullRequests } from './github'

export interface GeneratePersonOverviewResponse {
  success: boolean
  overview: {
    id: string
    content: string
    createdAt: string
  }
}

export type GenerateAISummaryResponse =
  | {
      success: true
      summary: {
        id: string
        content: string
        createdAt: string
      }
    }
  | {
      success: false
      error: string
    }

export type SynopsisType = 'overview' | 'jira-activity' | 'github-activity'

export async function generatePersonOverview(
  personId: string,
  options?: {
    lookbackDays?: number
  }
): Promise<GeneratePersonOverviewResponse> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get current person ID from session to enforce access control
  const currentPersonId = user.managerOSPersonId

  if (!currentPersonId) {
    throw new Error('User must be linked to a person to generate overviews')
  }

  // Access control: Only allow overview generation for:
  // 1. The user's linked person (currentPersonId === personId)
  // 2. The manager of that person (direct or indirect)
  const isOwnPerson = currentPersonId === personId
  const isManager = await checkIfManagerOrSelf(currentPersonId, personId)

  if (!isOwnPerson && !isManager) {
    throw new Error(
      'You can only generate overviews for your own person or for people you manage'
    )
  }

  // Default to 30 days lookback period
  const lookbackDays = options?.lookbackDays ?? 30
  const lookbackMs = lookbackDays * 24 * 60 * 60 * 1000

  // Fetch comprehensive person data
  const person = await getPersonForOverview(
    personId,
    user.managerOSOrganizationId,
    currentPersonId,
    lookbackMs
  )

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Fetch integration data (GitHub PRs and Jira tickets)
  // These functions handle all checks for integration enablement and user linking
  const [githubResult, jiraResult] = await Promise.all([
    fetchGithubPullRequests(personId, lookbackDays).catch(() => ({
      success: false as const,
      error: 'Failed to fetch',
    })),
    fetchJiraAssignedTickets(personId, lookbackDays).catch(() => ({
      success: false as const,
      error: 'Failed to fetch',
    })),
  ])

  // Process GitHub PRs if available
  const githubPrs =
    githubResult.success &&
    'pullRequests' in githubResult &&
    githubResult.pullRequests
      ? githubResult.pullRequests.map(pr => ({
          title: pr.title,
          repo: pr.repository.fullName,
          state: pr.state,
          mergedAt: pr.mergedAt,
          createdAt: pr.createdAt,
        }))
      : []

  // Process Jira tickets if available
  const jiraTickets =
    jiraResult.success && 'tickets' in jiraResult
      ? jiraResult.tickets.map(ticket => ({
          key: ticket.jiraIssueKey,
          title: ticket.issueTitle,
          status: ticket.status,
          priority: ticket.priority,
          project: ticket.projectKey,
          issueType: ticket.issueType,
        }))
      : []

  // Build structured data for AI
  const overviewData = {
    person: {
      name: person.name,
      email: person.email,
      role: person.role,
      employeeType: person.employeeType,
      startedAt: person.startedAt,
    },
    jobRole: person.jobRole
      ? {
          title: person.jobRole.title,
          level: person.jobRole.level.name,
          domain: person.jobRole.domain.name,
        }
      : null,
    team: person.team
      ? {
          name: person.team.name,
        }
      : null,
    manager: person.manager
      ? {
          name: person.manager.name,
          role: person.manager.role,
        }
      : null,
    directReports: person.reports.map(r => ({
      name: r.name,
      role: r.role,
    })),
    initiatives: person.initiativeOwners
      .filter(
        io =>
          io.initiative.status !== 'done' && io.initiative.status !== 'canceled'
      )
      .map(io => ({
        title: io.initiative.title,
        summary: io.initiative.summary,
        status: io.initiative.status,
        rag: io.initiative.rag,
        role: io.role,
      })),
    tasks: {
      active: person.tasks
        .filter(t => t.status !== 'done')
        .map(t => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
        })),
      recentlyCompleted: person.tasks
        .filter(t => t.status === 'done')
        .map(t => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          completedAt: t.completedAt,
        })),
      totalShown: person.tasks.length,
    },
    feedback: person.feedback.map(f => ({
      kind: f.kind,
      body: f.body,
      createdAt: f.createdAt,
      isPrivate: f.isPrivate,
    })),
    feedbackCampaigns: {
      count: person.feedbackCampaigns.length,
      totalResponses: person.feedbackCampaigns.reduce(
        (sum, c) => sum + c.responses.length,
        0
      ),
    },
    oneOnOnesWithManager: person.oneOnOnesWithManager
      ? person.oneOnOnesWithManager.map(
          (ooo: { scheduledAt: Date | null; notes: string | null }) => ({
            scheduledAt: ooo.scheduledAt,
            notes: ooo.notes,
          })
        )
      : [],
    githubActivity:
      githubPrs.length > 0
        ? {
            pullRequests: githubPrs,
            summary: {
              total: githubPrs.length,
              open: githubPrs.filter(pr => pr.state === 'open').length,
              merged: githubPrs.filter(pr => pr.mergedAt).length,
            },
          }
        : null,
    jiraActivity:
      jiraTickets.length > 0
        ? {
            tickets: jiraTickets,
            summary: {
              total: jiraTickets.length,
              byStatus: jiraTickets.reduce(
                (acc, t) => {
                  acc[t.status] = (acc[t.status] || 0) + 1
                  return acc
                },
                {} as Record<string, number>
              ),
            },
          }
        : null,
  }

  // Generate AI overview - prose-style with light analysis
  const system = `You are a professional HR/management assistant creating comprehensive person overviews.
Write in a professional, engaging prose style. Provide context and light analysis to help managers understand the person's current situation, contributions, and areas of focus.
Be specific and reference actual data provided. Connect the dots between different pieces of information to paint a complete picture.
Do not fabricate information not provided in the data, but do provide helpful context and observations based on the facts.`

  const prompt = `Create a professional overview for ${person.name} based on the following data. Write in prose style with helpful context and observations:

${JSON.stringify(overviewData, null, 2)}

Write 3-4 paragraphs covering:

1. **Role & Context**: Describe their position, team, and where they fit in the organization. Include their job level, domain, and reporting relationship. If they have direct reports, describe their team leadership responsibilities.

2. **Current Focus**: Describe what they're currently working on based on their initiatives and tasks. Highlight key projects, their status, and what this tells us about their priorities. If they have active tasks, summarize the volume and nature of their work.

3. **Performance & Engagement**: If feedback data is available, summarize the nature of feedback received. If 1:1 meeting data is available, note their engagement with their manager. Provide observations about their overall engagement and contribution patterns.

4. **Integration Activity** (if available): If GitHub or Jira activity is present, briefly mention their recent contributions and what areas they're focused on technically.

Write in a flowing, professional style that a manager would find useful for understanding this person's current situation. Be concise but informative.`

  const content = await generateText({
    system,
    prompt,
    temperature: 0.4,
    maxTokens: 800,
  })

  // Store as a PersonSynopsis with fromDate and toDate representing the lookback period
  // fromDate = lookback period start (today - lookbackDays)
  // toDate = today (when overview was generated)
  // includeFeedback = true to distinguish from regular time-bound synopses
  // Store lookbackDays in sources array for retrieval
  const toDate = new Date()
  const fromDate = new Date(toDate.getTime() - lookbackMs)

  const record = await prisma.personSynopsis.create({
    data: {
      personId: person.id,
      fromDate,
      toDate,
      includeFeedback: true,
      content,
      sources: [`lookbackDays:${lookbackDays}`],
      type: 'overview',
    },
  })

  return {
    success: true,
    overview: {
      id: record.id,
      content: record.content,
      createdAt: record.createdAt.toISOString(),
    },
  }
}

export async function getLatestPersonOverview(personId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  const currentPersonId = user.managerOSPersonId

  if (!currentPersonId) {
    throw new Error('User must be linked to a person to view overviews')
  }

  // Access control: Only allow viewing overviews for:
  // 1. The user's linked person (currentPersonId === personId)
  // 2. The manager of that person (direct or indirect)
  const isOwnPerson = currentPersonId === personId
  const isManager = await checkIfManagerOrSelf(currentPersonId, personId)

  if (!isOwnPerson && !isManager) {
    throw new Error(
      'You can only view overviews for your own person or for people you manage'
    )
  }

  // Verify person belongs to the same organization
  const person = await prisma.person.findFirst({
    where: { id: personId, organizationId: user.managerOSOrganizationId },
    select: { id: true },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Get the most recent overview by type
  const overview = await prisma.personSynopsis.findFirst({
    where: {
      personId,
      type: 'overview',
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!overview) {
    return null
  }

  // Extract lookbackDays from sources array
  const lookbackDaysSource = overview.sources.find((s: string) =>
    s.startsWith('lookbackDays:')
  )
  const lookbackDays = lookbackDaysSource
    ? parseInt(lookbackDaysSource.split(':')[1] || '30', 10)
    : 30 // Default to 30 if not found

  return {
    id: overview.id,
    content: overview.content,
    createdAt: overview.createdAt.toISOString(),
    updatedAt: overview.updatedAt.toISOString(),
    fromDate: overview.fromDate.toISOString(),
    toDate: overview.toDate.toISOString(),
    lookbackDays,
  }
}

/**
 * Generate an AI-powered summary of a person's Jira activity
 */
export async function generateJiraActivitySummary(
  personId: string,
  options?: { lookbackDays?: number }
): Promise<GenerateAISummaryResponse> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  const currentPersonId = user.managerOSPersonId
  if (!currentPersonId) {
    throw new Error('User must be linked to a person')
  }

  // Access control
  const isOwnPerson = currentPersonId === personId
  const isManager = await checkIfManagerOrSelf(currentPersonId, personId)
  if (!isOwnPerson && !isManager) {
    throw new Error(
      'You can only view activity for your own person or for people you manage'
    )
  }

  const lookbackDays = options?.lookbackDays ?? 30

  // Fetch Jira tickets
  const jiraResult = await fetchJiraAssignedTickets(personId, lookbackDays)

  if (
    !jiraResult.success ||
    !('tickets' in jiraResult) ||
    jiraResult.tickets.length === 0
  ) {
    return {
      success: false,
      error: 'No Jira activity found for the specified period.',
    }
  }

  const tickets = jiraResult.tickets

  // Build structured data for AI
  const ticketData = {
    totalTickets: tickets.length,
    byStatus: tickets.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ),
    byPriority: tickets.reduce(
      (acc, t) => {
        const priority = t.priority || 'Unset'
        acc[priority] = (acc[priority] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ),
    byType: tickets.reduce(
      (acc, t) => {
        acc[t.issueType] = (acc[t.issueType] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ),
    tickets: tickets.map(t => ({
      key: t.jiraIssueKey,
      title: t.issueTitle,
      status: t.status,
      priority: t.priority,
      type: t.issueType,
      project: t.projectKey,
    })),
  }

  const system = `You are an AI assistant providing detailed analysis of Jira activity.
Analyze the tickets and provide insights about:
1. What areas/themes the person is working on
2. The status distribution and what it indicates about workload
3. Priority breakdown and potential bottlenecks
4. Specific tickets that stand out (high priority, blockers, etc.)
Be analytical and provide actionable insights for managers.  Try to keep the analysis to 2-3 paragraphs and reference specific tickets if applicable.`

  const prompt = `Analyze the following Jira activity from the last ${lookbackDays} days:

${JSON.stringify(ticketData, null, 2)}

Provide a detailed analysis covering:
- **Work Themes**: What areas or features are they focused on?
- **Workload Analysis**: Comment on the volume and distribution of work
- **Priority Insights**: Are there high-priority items that need attention?
- **Status Overview**: What does the status distribution tell us?
- **Notable Tickets**: Highlight any tickets that managers should be aware of

Keep the analysis professional and actionable.  Try to keep the analysis to 2-3 paragraphs and reference specific tickets if applicable.`

  const content = await generateText({
    system,
    prompt,
    temperature: 0.3,
    maxTokens: 800,
  })

  // Store the summary in the database
  const toDate = new Date()
  const fromDate = new Date(
    toDate.getTime() - lookbackDays * 24 * 60 * 60 * 1000
  )

  const record = await prisma.personSynopsis.create({
    data: {
      personId,
      fromDate,
      toDate,
      includeFeedback: false,
      content,
      sources: [`lookbackDays:${lookbackDays}`],
      type: 'jira-activity',
    },
  })

  return {
    success: true,
    summary: {
      id: record.id,
      content: record.content,
      createdAt: record.createdAt.toISOString(),
    },
  }
}

/**
 * Get the latest Jira activity summary for a person
 */
export async function getLatestJiraActivitySummary(personId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  const currentPersonId = user.managerOSPersonId
  if (!currentPersonId) {
    throw new Error('User must be linked to a person')
  }

  // Access control
  const isOwnPerson = currentPersonId === personId
  const isManager = await checkIfManagerOrSelf(currentPersonId, personId)
  if (!isOwnPerson && !isManager) {
    throw new Error(
      'You can only view activity for your own person or for people you manage'
    )
  }

  // Verify person belongs to the same organization
  const person = await prisma.person.findFirst({
    where: { id: personId, organizationId: user.managerOSOrganizationId },
    select: { id: true },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  const summary = await prisma.personSynopsis.findFirst({
    where: {
      personId,
      type: 'jira-activity',
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!summary) {
    return null
  }

  // Extract lookbackDays from sources array
  const lookbackDaysSource = summary.sources.find((s: string) =>
    s.startsWith('lookbackDays:')
  )
  const lookbackDays = lookbackDaysSource
    ? parseInt(lookbackDaysSource.split(':')[1] || '30', 10)
    : 30

  return {
    id: summary.id,
    content: summary.content,
    createdAt: summary.createdAt.toISOString(),
    updatedAt: summary.updatedAt.toISOString(),
    fromDate: summary.fromDate.toISOString(),
    toDate: summary.toDate.toISOString(),
    lookbackDays,
  }
}

/**
 * Generate an AI-powered summary of a person's GitHub activity
 */
export async function generateGithubActivitySummary(
  personId: string,
  options?: { lookbackDays?: number }
): Promise<GenerateAISummaryResponse> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  const currentPersonId = user.managerOSPersonId
  if (!currentPersonId) {
    throw new Error('User must be linked to a person')
  }

  // Access control
  const isOwnPerson = currentPersonId === personId
  const isManager = await checkIfManagerOrSelf(currentPersonId, personId)
  if (!isOwnPerson && !isManager) {
    throw new Error(
      'You can only view activity for your own person or for people you manage'
    )
  }

  const lookbackDays = options?.lookbackDays ?? 30

  // Fetch GitHub PRs
  const githubResult = await fetchGithubPullRequests(personId, lookbackDays)

  if (!githubResult.success || !('pullRequests' in githubResult)) {
    return {
      success: false,
      error: 'No GitHub activity found for the specified period.',
    }
  }

  const pullRequests = githubResult.pullRequests ?? []

  if (pullRequests.length === 0) {
    return {
      success: false,
      error: 'No GitHub activity found for the specified period.',
    }
  }

  // Build structured data for AI
  const prData = {
    totalPRs: pullRequests.length,
    open: pullRequests.filter(pr => pr.state === 'open').length,
    merged: pullRequests.filter(pr => pr.mergedAt).length,
    closed: pullRequests.filter(pr => pr.state === 'closed' && !pr.mergedAt)
      .length,
    byRepository: pullRequests.reduce(
      (acc, pr) => {
        const repo = pr.repository.fullName
        acc[repo] = (acc[repo] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ),
    pullRequests: pullRequests.map(pr => ({
      title: pr.title,
      repo: pr.repository.fullName,
      state: pr.state,
      merged: !!pr.mergedAt,
      createdAt: pr.createdAt,
    })),
  }

  const system = `You are an AI assistant providing detailed analysis of GitHub activity.
Analyze the pull requests and provide insights about:
1. What areas/codebases the person is contributing to
2. The nature of their contributions (features, fixes, refactoring)
3. Code velocity and patterns
4. Specific PRs that stand out
Be analytical and provide actionable insights for managers.  Try to keep the analysis to 2-3 paragraphs and reference specific PRs if applicable.`

  const prompt = `Analyze the following GitHub activity from the last ${lookbackDays} days:

${JSON.stringify(prData, null, 2)}

Provide a detailed analysis covering:
- **Contribution Areas**: Which repositories and areas are they focused on?
- **Work Patterns**: What types of work do the PRs represent based on titles? (features, bugs, refactoring)
- **Velocity Insights**: Comment on the volume and merge rate
- **Notable PRs**: Highlight any PRs that managers should be aware of based on the titles

Keep the analysis professional and actionable.`

  const content = await generateText({
    system,
    prompt,
    temperature: 0.3,
    maxTokens: 800,
  })

  // Store the summary in the database
  const toDate = new Date()
  const fromDate = new Date(
    toDate.getTime() - lookbackDays * 24 * 60 * 60 * 1000
  )

  const record = await prisma.personSynopsis.create({
    data: {
      personId,
      fromDate,
      toDate,
      includeFeedback: false,
      content,
      sources: [`lookbackDays:${lookbackDays}`],
      type: 'github-activity',
    },
  })

  return {
    success: true,
    summary: {
      id: record.id,
      content: record.content,
      createdAt: record.createdAt.toISOString(),
    },
  }
}

/**
 * Get the latest GitHub activity summary for a person
 */
export async function getLatestGithubActivitySummary(personId: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  const currentPersonId = user.managerOSPersonId
  if (!currentPersonId) {
    throw new Error('User must be linked to a person')
  }

  // Access control
  const isOwnPerson = currentPersonId === personId
  const isManager = await checkIfManagerOrSelf(currentPersonId, personId)
  if (!isOwnPerson && !isManager) {
    throw new Error(
      'You can only view activity for your own person or for people you manage'
    )
  }

  // Verify person belongs to the same organization
  const person = await prisma.person.findFirst({
    where: { id: personId, organizationId: user.managerOSOrganizationId },
    select: { id: true },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  const summary = await prisma.personSynopsis.findFirst({
    where: {
      personId,
      type: 'github-activity',
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!summary) {
    return null
  }

  // Extract lookbackDays from sources array
  const lookbackDaysSource = summary.sources.find((s: string) =>
    s.startsWith('lookbackDays:')
  )
  const lookbackDays = lookbackDaysSource
    ? parseInt(lookbackDaysSource.split(':')[1] || '30', 10)
    : 30

  return {
    id: summary.id,
    content: summary.content,
    createdAt: summary.createdAt.toISOString(),
    updatedAt: summary.updatedAt.toISOString(),
    fromDate: summary.fromDate.toISOString(),
    toDate: summary.toDate.toISOString(),
    lookbackDays,
  }
}
