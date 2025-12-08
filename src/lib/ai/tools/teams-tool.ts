import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma'

export const teamsTool = {
  description: 'Get information about teams in the organization',
  parameters: z.object({
    parentId: z.string().optional().describe('Filter by parent team ID'),
    query: z
      .string()
      .optional()
      .describe('Search query to filter teams by name or description'),
  }),
  execute: async ({
    parentId,
    query,
  }: {
    parentId?: string
    query?: string
  }) => {
    console.log('🔧 teamsTool called with parameters:', {
      parentId,
      query,
    })
    const user = await getCurrentUser()
    if (!user.managerOSOrganizationId) {
      throw new Error('User must belong to an organization')
    }

    const whereClause: Prisma.TeamWhereInput = {
      organizationId: user.managerOSOrganizationId,
    }

    if (parentId) whereClause.parentId = parentId
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        people: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        _count: {
          select: {
            people: true,
            children: true,
            initiatives: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return {
      teams: teams.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        parent: team.parent?.name,
        children: team.children.map(c => c.name),
        members: team.people.map(p => ({
          id: p.id,
          name: p.name,
          role: p.role,
        })),
        membersCount: team._count.people,
        childrenCount: team._count.children,
        initiativesCount: team._count.initiatives,
      })),
    }
  },
}
