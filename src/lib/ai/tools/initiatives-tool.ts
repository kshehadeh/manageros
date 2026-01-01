import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma'

export const initiativesTool = {
  description:
    'Get information about specific initiatives in the organization. It uses things like status, RAG, team and owners/collaborators, keywords, teams, priority, or slot assignment to filter the list. The initiatives returned are limited to this filter. Use this tool with each new query as opposed to using previous responses for future queries.',
  parameters: z.object({
    status: z
      .enum(['planned', 'in_progress', 'paused', 'done', 'canceled'])
      .optional()
      .describe('Filter by initiative status'),
    rag: z
      .enum(['green', 'amber', 'red'])
      .optional()
      .describe('Filter by RAG status'),
    personId: z
      .string()
      .optional()
      .describe(
        'Filter by people who are in the list of owners of the initiative. This is the ID of the person - use the prompt to look up the person using a different tool and pass in the ID of the person here.'
      ),
    teamId: z.string().optional().describe('Filter by team ID'),
    query: z
      .string()
      .optional()
      .describe('Search query to filter initiatives by title or summary'),
    priority: z
      .number()
      .optional()
      .describe(
        'Filter by priority level (1 = highest priority, 2 = medium, 3 = low, etc.)'
      ),
    hasSlot: z
      .boolean()
      .optional()
      .describe(
        'Filter by slot assignment - true for initiatives assigned to a slot, false for unassigned'
      ),
    slotNumber: z
      .number()
      .optional()
      .describe('Filter by specific slot number'),
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
    hasSlot?: boolean
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

    if (status) whereClause.status = status
    if (rag) whereClause.rag = rag
    if (teamId) whereClause.teamId = teamId
    if (personId) {
      whereClause.owners = {
        some: {
          personId: personId,
        },
      }
    }
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
      ]
    }
    if (priority !== undefined) whereClause.priority = priority
    if (hasSlot !== undefined) {
      whereClause.slot = hasSlot ? { not: null } : null
    }
    if (slotNumber !== undefined) whereClause.slot = slotNumber

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

    return {
      initiatives: initiatives.map(initiative => ({
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
        tasks: initiative.tasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
        })),
      })),
    }
  },
}
