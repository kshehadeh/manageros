import 'server-only'

import { cache } from 'react'
import { prisma } from '@/lib/db'

export const getTeamById = cache(
  async (
    teamId: string,
    organizationId: string,
    options?: {
      includeParent?: boolean
      includeChildren?: boolean
      includePeople?: boolean
      includeInitiatives?: boolean
    }
  ) => {
    const include: Record<string, unknown> = {}
    if (options?.includeParent) {
      include.parent = true
    }
    if (options?.includeChildren) {
      include.children = {
        include: {
          people: {
            select: {
              id: true,
              name: true,
            },
          },
          initiatives: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }
    }
    if (options?.includePeople) {
      include.people = {
        include: {
          manager: {
            include: {
              reports: true,
            },
          },
          team: true,
          jobRole: {
            include: {
              level: true,
              domain: true,
            },
          },
          reports: true,
        },
        orderBy: { name: 'asc' },
      }
    }
    if (options?.includeInitiatives) {
      include.initiatives = {
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }
    }

    return prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId,
      },
      include: Object.keys(include).length > 0 ? include : undefined,
    })
  }
)
