import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma'

export const teamLookupTool = {
  description:
    'Look up a specific team by name. Use this when you need to find the team ID for a team mentioned by name. Returns team details including ID, which can be used with other tools.',
  parameters: z.object({
    name: z.string().describe('The name of the team to look up'),
  }),
  execute: async ({ name }: { name: string }) => {
    console.log('🔧 teamLookupTool called with parameters:', { name })
    try {
      const user = await getCurrentUser()
      if (!user.managerOSOrganizationId) {
        throw new Error('User must belong to an organization')
      }

      // Search for teams by name
      const whereClause: Prisma.TeamWhereInput = {
        organizationId: user.managerOSOrganizationId,
        name: { contains: name, mode: 'insensitive' },
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
          _count: {
            select: {
              people: true,
              children: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      if (teams.length === 0) {
        return {
          found: false,
          message: `No team found with name containing "${name}"`,
          matches: [],
        }
      }

      const matches = teams.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        parent: team.parent?.name || null,
        memberCount: team._count.people,
        subteamCount: team._count.children,
      }))

      if (teams.length === 1) {
        return {
          found: true,
          message: `Found 1 team matching "${name}"`,
          matches,
        }
      }

      return {
        found: true,
        message: `Found ${teams.length} teams matching "${name}". Please ask the user to clarify which team they mean.`,
        matches,
        disambiguationNeeded: true,
      }
    } catch (error) {
      console.error('Error in team lookup tool:', error)
      throw error
    }
  },
}
