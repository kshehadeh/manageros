'use server'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'
import { generateText } from '@/lib/ai'
import { getPersonForOverview } from './person'
import { checkIfManagerOrSelf } from '@/lib/utils/people-utils'

export interface GeneratePersonOverviewResponse {
  success: boolean
  overview: {
    id: string
    content: string
    createdAt: string
  }
}

export async function generatePersonOverview(
  personId: string,
  options?: {
    lookbackDays?: number
  }
): Promise<GeneratePersonOverviewResponse> {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  // Get current person ID from session to enforce access control
  const currentPersonId = user.personId

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
    user.organizationId,
    currentPersonId,
    lookbackMs
  )

  if (!person) {
    throw new Error('Person not found or access denied')
  }

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
  }

  // Generate AI overview
  const system = `You are a professional HR/management assistant creating comprehensive person overviews. 
Write in a professional but conversational tone. Focus on facts and structure the overview logically.
Create 3-5 paragraphs covering: role and position, current responsibilities and initiatives, team leadership (if applicable), performance highlights (if feedback available), and one-on-one meeting insights (if available).
Be concise and specific. Do not fabricate information not provided in the data.`

  const prompt = `Create a professional overview for ${person.name} based on the following information:

${JSON.stringify(overviewData, null, 2)}

Guidelines:
- Start with their role, team, and reporting structure
- Describe their current initiatives and responsibilities
- If they have direct reports, mention their team leadership
- If feedback data is available, briefly mention performance highlights
- If one-on-one meeting notes are available, incorporate key insights from those discussions
- Keep it professional, factual, and well-structured
- Use 3-5 paragraphs`

  const content = await generateText({
    system,
    prompt,
    temperature: 0.3,
    maxTokens: 600,
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
      sources: ['overview', `lookbackDays:${lookbackDays}`], // Special source identifier with lookback period
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

  if (!user.organizationId) {
    throw new Error('User must belong to an organization')
  }

  const currentPersonId = user.personId

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
    where: { id: personId, organizationId: user.organizationId },
    select: { id: true },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Get the most recent overview (identified by sources containing 'overview')
  const overview = await prisma.personSynopsis.findFirst({
    where: {
      personId,
      sources: {
        has: 'overview',
      },
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
