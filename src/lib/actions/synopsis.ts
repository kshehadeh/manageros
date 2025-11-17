'use server'

import { prisma } from '@/lib/db'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { generateText } from '@/lib/ai'
import { GithubApiService } from '@/lib/github-api'
import { JiraApiService } from '@/lib/jira-api'

export interface GenerateSynopsisParams {
  personId: string
  fromDate: string // ISO date
  toDate: string // ISO date
  includeFeedback?: boolean
}

export interface SynopsisSummary {
  id: string
  content: string
  createdAt: string
  sources: string[]
  fromDate: string
  toDate: string
  includeFeedback: boolean
}

export interface GenerateSynopsisResponse {
  success: boolean
  synopsis: SynopsisSummary
}

export interface ListSynopsesResponse {
  success: boolean
  synopses: SynopsisSummary[]
}

export async function generatePersonSynopsis(
  params: GenerateSynopsisParams
): Promise<GenerateSynopsisResponse> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization')
  }

  const { personId, fromDate, toDate, includeFeedback = false } = params

  // Get current person ID from session to enforce access control and feedback privacy
  const currentPersonId = user.managerOSPersonId

  const person = await prisma.person.findFirst({
    where: { id: personId, organizationId: user.managerOSOrganizationId },
    include: {
      tasks: {
        where: {
          OR: [
            { updatedAt: { gte: new Date(fromDate), lte: new Date(toDate) } },
            { completedAt: { gte: new Date(fromDate), lte: new Date(toDate) } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
      },
      githubAccount: true,
      jiraAccount: true,
      feedback: {
        where: {
          createdAt: { gte: new Date(fromDate), lte: new Date(toDate) },
          OR: [
            { isPrivate: false },
            currentPersonId
              ? { AND: [{ isPrivate: true }, { fromId: currentPersonId }] }
              : { id: { equals: '' } }, // no private feedback if no current person
          ],
        },
        orderBy: { createdAt: 'desc' },
      },
      feedbackCampaigns: {
        where: {
          endDate: { gte: new Date(fromDate) },
          startDate: { lte: new Date(toDate) },
        },
        include: {
          responses: true,
        },
      },
    },
  })

  if (!person) throw new Error('Person not found or access denied')

  // Access control: Only allow synopsis generation for:
  // 1. The user's linked person (currentPersonId)
  // 2. Organization admins or owners can generate synopses for any person
  const isOwnPerson = currentPersonId === person.id
  const isOrgAdmin = isAdminOrOwner(user)

  if (!isOwnPerson && !isOrgAdmin) {
    throw new Error(
      'You can only generate synopses for your linked person or you must be an organization admin or owner'
    )
  }

  // Collect sources
  const sources: string[] = ['tasks']

  // GitHub PRs
  let githubPrs: Array<{
    title: string
    repo: string
    state: string
    mergedAt?: string | null
  }> = []
  if (person.githubAccount) {
    const userCreds = await prisma.userGithubCredentials.findUnique({
      where: { userId: user.managerOSUserId || '' },
    })
    if (userCreds) {
      const gh = GithubApiService.fromEncryptedCredentials(
        userCreds.githubUsername,
        userCreds.encryptedPat
      )
      const daysBack = Math.max(
        1,
        Math.ceil(
          (new Date(toDate).getTime() - new Date(fromDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
      const prs = await gh.getRecentPullRequests(
        person.githubAccount.githubUsername,
        daysBack
      )
      githubPrs = prs.map(pr => ({
        title: pr.title,
        repo: pr.repository.fullName,
        state: pr.state,
        mergedAt: pr.mergedAt,
      }))
      if (githubPrs.length > 0) sources.push('github')
    }
  }

  // Jira tickets
  let jiraTickets: Array<{
    key: string
    title: string
    status: string
    project: string
  }> = []
  if (person.jiraAccount) {
    const creds = await prisma.userJiraCredentials.findUnique({
      where: { userId: user.managerOSUserId || '' },
    })
    if (creds) {
      const jira = JiraApiService.fromEncryptedCredentials(
        creds.jiraUsername,
        creds.encryptedApiKey,
        creds.jiraBaseUrl
      )
      const tickets = await jira.getUserAssignedTickets(
        person.jiraAccount.jiraAccountId,
        fromDate.split('T')[0],
        toDate.split('T')[0]
      )
      jiraTickets = tickets.map(t => ({
        key: t.issue.key,
        title: t.issue.fields.summary,
        status: t.issue.fields.status.name,
        project: t.issue.fields.project.key,
      }))
      if (jiraTickets.length > 0) sources.push('jira')
    }
  }

  // Feedback and campaign responses
  const feedbackNotes = includeFeedback
    ? (person.feedback?.map(f => ({
        kind: f.kind,
        body: f.body,
        createdAt: f.createdAt,
        isPrivate: f.isPrivate,
      })) ?? [])
    : []

  const campaignSummaries = includeFeedback
    ? (person.feedbackCampaigns?.map(c => ({
        name: c.name,
        startDate: c.startDate,
        endDate: c.endDate,
        responseCount: c.responses.length,
      })) ?? [])
    : []

  if (
    includeFeedback &&
    (feedbackNotes.length > 0 || campaignSummaries.length > 0)
  ) {
    sources.push('feedback')
  }

  // Construct prompt
  const system =
    'You write concise professional weekly work synopses for managers. Keep it to 5-8 bullet points, past tense, specific outcomes and metrics when available. Avoid jargon. If information is sparse, state high-level focus. Do not fabricate.'

  const payload = {
    person: { id: person.id, name: person.name, role: person.role },
    period: { fromDate, toDate },
    tasks: person.tasks.map(t => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      updatedAt: t.updatedAt,
      completedAt: t.completedAt,
      initiative: t.initiativeId,
      objective: t.objectiveId,
    })),
    githubPrs,
    jiraTickets,
    feedbackNotes,
    campaignSummaries,
  }

  const prompt = `Create a concise synopsis of ${person.name}'s work between ${fromDate} and ${toDate}. Default to tasks and include GitHub/Jira if present${includeFeedback ? ' and include feedback highlights' : ''}. Use bullet points. Data:\n\n${JSON.stringify(payload, null, 2)}`

  const content = await generateText({
    system,
    prompt,
    temperature: 0.2,
    maxTokens: 350,
  })

  const record = await prisma.personSynopsis.create({
    data: {
      personId: person.id,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      includeFeedback,
      content,
      sources,
    },
  })

  return {
    success: true,
    synopsis: {
      id: record.id,
      content: record.content,
      createdAt: record.createdAt.toISOString(),
      sources: record.sources,
      fromDate: record.fromDate.toISOString(),
      toDate: record.toDate.toISOString(),
      includeFeedback: record.includeFeedback,
    },
  }
}

export async function listPersonSynopses(
  personId: string,
  limit = 10
): Promise<ListSynopsesResponse> {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId)
    throw new Error('User must belong to an organization')

  // Get current person ID from session to enforce access control
  const currentPersonId = user.managerOSPersonId

  const person = await prisma.person.findFirst({
    where: { id: personId, organizationId: user.managerOSOrganizationId },
    select: { id: true },
  })
  if (!person) throw new Error('Person not found or access denied')

  // Access control: Only allow viewing synopses for:
  // 1. The user's linked person (currentPersonId)
  // 2. Organization admins or owners can view synopses for any person
  const isOwnPerson = currentPersonId === person.id
  const isOrgAdmin = isAdminOrOwner(user)

  if (!isOwnPerson && !isOrgAdmin) {
    throw new Error(
      'You can only view synopses for your linked person or you must be an organization admin or owner'
    )
  }

  const synopses = await prisma.personSynopsis.findMany({
    where: { personId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return {
    success: true,
    synopses: synopses.map(s => ({
      id: s.id,
      content: s.content,
      createdAt: s.createdAt.toISOString(),
      sources: s.sources,
      fromDate: s.fromDate.toISOString(),
      toDate: s.toDate.toISOString(),
      includeFeedback: s.includeFeedback,
    })),
  }
}

export async function deleteSynopsis(synopsisId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user.managerOSOrganizationId)
    throw new Error('User must belong to an organization')

  // Get current person ID from session to enforce access control
  const currentPersonId = user.managerOSPersonId

  // Verify the synopsis belongs to a person in the user's organization
  const synopsis = await prisma.personSynopsis.findFirst({
    where: {
      id: synopsisId,
      person: { organizationId: user.managerOSOrganizationId },
    },
    select: { id: true, personId: true },
  })

  if (!synopsis) throw new Error('Synopsis not found or access denied')

  // Access control: Only allow deletion for:
  // 1. The user's linked person (currentPersonId)
  // 2. Organization admins can delete synopses for any person
  const isOwnPerson = currentPersonId === synopsis.personId
  const isOrgAdmin = isAdminOrOwner(user)

  if (!isOwnPerson && !isOrgAdmin) {
    throw new Error(
      'You can only delete synopses for your linked person or you must be an organization admin or owner'
    )
  }

  await prisma.personSynopsis.delete({
    where: { id: synopsisId },
  })
}
