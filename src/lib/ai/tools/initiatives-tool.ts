import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma'
import { ALL_INITIATIVE_STATUSES } from '../../initiative-status'

export const initiativesTool = {
  description:
    'Get information about specific initiatives in the organization. It uses things like status, RAG, team and owners/collaborators, keywords, teams, priority, or slot assignment to filter the list. The initiatives returned are limited to this filter. The response includes a latestCheckIn field (when available) which represents the most recent check-in for that initiative; use it when the user asks about the initiative\'s current state. Use this tool with each new query as opposed to using previous responses for future queries. IMPORTANT: When the user asks about "my initiatives", "initiatives I\'m involved in", or anything related to their own initiatives, FIRST use the currentUser tool to get the current user\'s person ID, then use this tool with that personId parameter.',
  parameters: z.object({
    status: z
      .enum([...ALL_INITIATIVE_STATUSES, 'not-specified'])
      .optional()
      .describe(
        'Filter by initiative status - not-specified means no status filter'
      ),
    rag: z
      .enum(['green', 'amber', 'red', 'not-specified'])
      .optional()
      .describe('Filter by RAG status - not-specified means no RAG filter'),
    personId: z
      .string()
      .optional()
      .describe(
        'Filter by people who are in the list of owners of the initiative. This is the ID of the person. When the user asks about "my initiatives" or refers to themselves (e.g., "I", "me", "my"), FIRST use the currentUser tool to get their person ID, then pass it here. For other people, use the personLookup tool to find their person ID. Not-specified means no owner filter.'
      ),
    teamId: z
      .string()
      .optional()
      .describe('Filter by team ID - not-specified means no team filter'),
    query: z
      .string()
      .optional()
      .describe('Search query to filter initiatives by title or summary'),
    priority: z
      .number()
      .optional()
      .describe(
        'Filter by priority level (1 = highest priority, 2 = medium, 3 = low, etc. - 0 means no priority filter)'
      ),
    hasSlot: z
      .enum(['true', 'false', 'not-specified'])
      .optional()
      .describe(
        'Filter by slot assignment - true for initiatives assigned to a slot, false for unassigned, not-specified means no slot filter'
      ),
    slotNumber: z
      .number()
      .optional()
      .describe('Filter by specific slot number - 0 means no slot filter'),
  }),
  execute: async ({
    status,
    rag,
    teamId,
    personId,
    query,
    priority,
    hasSlot,
    slotNumber,
  }: {
    status?: string
    rag?: string
    teamId?: string
    personId?: string
    query?: string
    priority?: number
    hasSlot?: string
    slotNumber?: number
  }) => {
    console.log('🔧 initiativesTool called with parameters:', {
      status,
      rag,
      teamId,
      personId,
      query,
      priority,
      hasSlot,
      slotNumber,
    })
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error('User must belong to an organization')
    }

    const whereClause: Prisma.InitiativeWhereInput = {
      organizationId: user.managerOSOrganizationId,
    }

    if (status && status !== 'not-specified') whereClause.status = status
    if (rag && rag !== 'not-specified') whereClause.rag = rag
    if (teamId && teamId !== 'not-specified') whereClause.teamId = teamId
    if (personId && personId !== 'not-specified') {
      whereClause.owners = {
        some: {
          personId: personId,
        },
      }
    }
    if (query && query !== '') {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
      ]
    }
    if (priority !== undefined && priority !== 0)
      whereClause.priority = priority
    if (hasSlot !== undefined && hasSlot !== 'not-specified') {
      whereClause.slot = hasSlot === 'true' ? { not: null } : null
    }
    if (slotNumber !== undefined && slotNumber !== 0)
      whereClause.slot = slotNumber

    console.log('🔍 whereClause:', whereClause)

    const initiatives = await prisma.initiative.findMany({
      where: whereClause,
      include: {
        team: true,
        owners: {
          include: {
            person: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        objectives: true,
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            objectives: true,
            tasks: true,
            checkIns: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Fetch the most recent check-in for each initiative
    const initiativeIds = initiatives.map(i => i.id)
    const checkIns = await prisma.checkIn.findMany({
      where: {
        initiativeId: { in: initiativeIds },
        initiative: { organizationId: user.managerOSOrganizationId },
      },
      select: {
        id: true,
        initiativeId: true,
        weekOf: true,
        rag: true,
        confidence: true,
        summary: true,
        blockers: true,
        nextSteps: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group check-ins by initiativeId and get the most recent one for each
    const latestCheckInsByInitiative = new Map<string, (typeof checkIns)[0]>()
    for (const checkIn of checkIns) {
      if (!latestCheckInsByInitiative.has(checkIn.initiativeId)) {
        latestCheckInsByInitiative.set(checkIn.initiativeId, checkIn)
      }
    }

    return {
      initiatives: initiatives.map(initiative => {
        const latestCheckIn = latestCheckInsByInitiative.get(initiative.id)
        return {
          id: initiative.id,
          title: initiative.title,
          summary: initiative.summary,
          status: initiative.status,
          rag: initiative.rag,
          confidence: initiative.confidence,
          priority: initiative.priority,
          slot: initiative.slot,
          startDate: initiative.startDate,
          targetDate: initiative.targetDate,
          team: initiative.team?.name,
          owners: initiative.owners,
          objectivesCount: initiative._count.objectives,
          tasksCount: initiative._count.tasks,
          checkInsCount: initiative._count.checkIns,
          latestCheckIn: latestCheckIn
            ? {
                id: latestCheckIn.id,
                weekOf: latestCheckIn.weekOf,
                rag: latestCheckIn.rag,
                confidence: latestCheckIn.confidence,
                summary: latestCheckIn.summary,
                blockers: latestCheckIn.blockers,
                nextSteps: latestCheckIn.nextSteps,
                createdAt: latestCheckIn.createdAt,
                createdBy: latestCheckIn.createdBy,
              }
            : null,
          tasks: initiative.tasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
          })),
        }
      }),
    }
  },
}
