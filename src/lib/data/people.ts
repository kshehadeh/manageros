import 'server-only'

import { cache } from 'react'
import { prisma } from '@/lib/db'

export const getActivePeopleForOrganization = cache(
  async (organizationId: string) => {
    if (!organizationId) {
      return []
    }

    return prisma.person.findMany({
      where: {
        status: 'active',
        organizationId,
      },
      include: {
        jobRole: {
          include: {
            level: true,
            domain: true,
          },
        },
        team: true,
        manager: true,
        reports: true,
        user: true,
      },
      orderBy: { name: 'asc' },
    })
  }
)
