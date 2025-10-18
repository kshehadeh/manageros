import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export const initiativesTool = {
  description:
    'Get information about initiatives in the organization and when the user is interested in his own initiatives, lookup who he is and use that person ID to associate with one of the owners of the initiative.',
  parameters: z.object({
    status: z
      .enum(['planned', 'in_progress', 'paused', 'done', 'canceled'])
      .optional()
      .describe('Filter by initiative status'),
    rag: z
      .enum(['green', 'amber', 'red'])
      .optional()
      .describe('Filter by RAG status'),
    teamId: z.string().optional().describe('Filter by team ID'),
    query: z
      .string()
      .optional()
      .describe('Search query to filter initiatives by title or summary'),
  }),
  execute: async ({
    status,
    rag,
    teamId,
    query,
  }: {
    status?: string
    rag?: string
    teamId?: string
    query?: string
  }) => {
    console.log('🔧 initiativesTool called with parameters:', {
      status,
      rag,
      teamId,
      query,
    })
    const user = await getCurrentUser()
    if (!user.organizationId) {
      throw new Error('User must belong to an organization')
    }

    const whereClause: Prisma.InitiativeWhereInput = {
      organizationId: user.organizationId,
    }

    if (status) whereClause.status = status
    if (rag) whereClause.rag = rag
    if (teamId) whereClause.teamId = teamId
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
      ]
    }

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
