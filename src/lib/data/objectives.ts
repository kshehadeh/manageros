import 'server-only'

import { cache } from 'react'
import { prisma } from '@/lib/db'

export const getObjectivesForOrganization = cache(
  async (organizationId: string) => {
    return prisma.objective.findMany({
      where: {
        initiative: {
          organizationId,
        },
      },
      orderBy: { title: 'asc' },
    })
  }
)
