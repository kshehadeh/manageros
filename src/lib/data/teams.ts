import 'server-only'

import { prisma } from '@/lib/db'

export async function getTeamById(teamId: string, organizationId: string) {
  return prisma.team.findFirst({
    where: {
      id: teamId,
      organizationId,
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      children: {
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
      },
      people: {
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
      },
      initiatives: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })
}
