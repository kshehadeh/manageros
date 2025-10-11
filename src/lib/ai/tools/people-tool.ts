import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export const peopleTool = {
  description: 'Get information about people in the organization',
  parameters: z.object({
    query: z
      .string()
      .optional()
      .describe('Search query to filter people by name, role, or team'),
    includeManager: z
      .boolean()
      .optional()
      .describe('Whether to include manager information'),
    includeReports: z
      .boolean()
      .optional()
      .describe('Whether to include direct reports'),
  }),
  execute: async ({
    query,
    includeManager = false,
    includeReports = false,
  }: {
    query?: string
    includeManager?: boolean
    includeReports?: boolean
  }) => {
    try {
      const user = await getCurrentUser()
      if (!user.organizationId) {
        throw new Error('User must belong to an organization')
      }

      const whereClause: Prisma.PersonWhereInput = {
        organizationId: user.organizationId,
        status: 'active',
      }

      if (query) {
        whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { role: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ]
      }

      const people = await prisma.person.findMany({
        where: whereClause,
        include: {
          team: true,
          manager: includeManager
            ? {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              }
            : false,
          reports: includeReports
            ? {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              }
            : false,
          jobRole: {
            include: {
              level: true,
              domain: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      const result = {
        people: people.map(person => ({
          id: person.id,
          name: person.name,
          email: person.email,
          role: person.role,
          team: person.team?.name,
          manager: person.manager?.name,
          reports: person.reports?.map(r => r.name),
          jobRole: person.jobRole?.title,
          jobLevel: person.jobRole?.level?.name,
          jobDomain: person.jobRole?.domain?.name,
        })),
      }

      return result
    } catch (error) {
      console.error('Error in people tool:', error)
      throw error
    }
  },
}
