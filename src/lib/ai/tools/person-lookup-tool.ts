import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export const personLookupTool = {
  description:
    'Look up a specific person by name (not the current user). Use this when you need to find the person ID for someone mentioned by name. Returns person details including ID, which can be used with other tools.',
  parameters: z.object({
    name: z
      .string()
      .describe(
        'The name (first, last, or full name) of the person to look up'
      ),
  }),
  execute: async ({ name }: { name: string }) => {
    console.log('🔧 personLookupTool called with parameters:', { name })
    try {
      const user = await getCurrentUser()
      if (!user.managerOSOrganizationId) {
        throw new Error('User must belong to an organization')
      }

      // Search for people by name
      const whereClause: Prisma.PersonWhereInput = {
        organizationId: user.managerOSOrganizationId,
        status: 'active',
        name: { contains: name, mode: 'insensitive' },
      }

      const people = await prisma.person.findMany({
        where: whereClause,
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          jobRole: {
            include: {
              level: true,
              domain: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      if (people.length === 0) {
        return {
          found: false,
          message: `No person found with name containing "${name}"`,
          matches: [],
        }
      }

      const matches = people.map(person => ({
        id: person.id,
        name: person.name,
        email: person.email,
        role: person.role,
        team: person.team?.name || null,
        manager: person.manager?.name || null,
        jobRole: person.jobRole?.title || null,
        jobLevel: person.jobRole?.level?.name || null,
        jobDomain: person.jobRole?.domain?.name || null,
      }))

      if (people.length === 1) {
        return {
          found: true,
          message: `Found 1 person matching "${name}"`,
          matches,
        }
      }

      return {
        found: true,
        message: `Found ${people.length} people matching "${name}". Please ask the user to clarify which person they mean.`,
        matches,
        disambiguationNeeded: true,
      }
    } catch (error) {
      console.error('Error in person lookup tool:', error)
      throw error
    }
  },
}
