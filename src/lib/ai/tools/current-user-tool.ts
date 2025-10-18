import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'

export const currentUserTool = {
  description:
    'Get information about the current user to help interpret pronouns like "me" or "I" or "my" in chat inputs',
  parameters: z.object({}),
  execute: async () => {
    console.log('🔧 currentUserTool called with parameters:', {})
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    if (!user.organizationId) {
      throw new Error('User must belong to an organization')
    }

    if (!user.personId) {
      throw new Error('User is not linked to a person record')
    }

    // Get the person record linked to this user
    const person = await prisma.person.findFirst({
      where: {
        id: user.personId,
        organizationId: user.organizationId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        reports: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        jobRole: {
          include: {
            level: true,
            domain: true,
          },
        },
      },
    })

    if (!person) {
      throw new Error('No person record found for current user')
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      person: {
        id: person.id,
        name: person.name,
        email: person.email,
        role: person.role,
        team: person.team?.name,
        manager: person.manager?.name,
        reports: person.reports.map((r: { name: string }) => r.name),
        jobRole: person.jobRole?.title,
        jobLevel: person.jobRole?.level?.name,
        jobDomain: person.jobRole?.domain?.name,
      },
    }
  },
}
