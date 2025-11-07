import 'server-only'

import { prisma } from '@/lib/db'

export async function getTeamById(
  teamId: string,
  organizationId: string,
  options?: {
    includeParent?: boolean
    includeChildren?: boolean
    includePeople?: boolean
    includeInitiatives?: boolean
    includeJobRoles?: boolean
  }
) {
  const include: Record<string, unknown> = {}
  if (options?.includeParent) {
    include.parent = {
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    }
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
  if (options?.includeJobRoles) {
    include.people = {
      include: {
        jobRole: true,
      },
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
