'use server'

import { prisma } from '@/lib/db'
import {
  getCurrentUser,
  getCurrentUserWithPersonAndOrganization,
} from '@/lib/auth-utils'
import type { Initiative } from '@/components/initiatives/initiative-list'

/**
 * Get list of open initiatives (planned or in_progress)
 */
export async function getOpenInitiatives(): Promise<Initiative[]> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return []
  }

  const organizationId = user.managerOSOrganizationId

  // Get all open initiatives
  const initiatives = await prisma.initiative.findMany({
    where: {
      organizationId,
      status: {
        in: ['planned', 'in_progress'],
      },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          tasks: true,
          checkIns: true,
          objectives: true,
        },
      },
    },
  })

  // Transform to Initiative format
  return initiatives.map(initiative => ({
    id: initiative.id,
    title: initiative.title,
    description: initiative.summary,
    status: initiative.status,
    rag: initiative.rag,
    team: initiative.team,
    updatedAt: initiative.updatedAt,
    createdAt: initiative.createdAt,
    _count: initiative._count,
  }))
}

/**
 * Get list of initiatives where the current user is an owner
 */
export async function getUserInitiatives(): Promise<Initiative[]> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return []
  }

  const organizationId = user.managerOSOrganizationId
  const { person } = await getCurrentUserWithPersonAndOrganization()
  const currentPersonId = person?.id

  if (!currentPersonId) {
    return []
  }

  // Get initiatives where current user is an owner
  const initiatives = await prisma.initiative.findMany({
    where: {
      organizationId,
      owners: {
        some: {
          personId: currentPersonId,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          tasks: true,
          checkIns: true,
          objectives: true,
        },
      },
    },
  })

  // Transform to Initiative format
  return initiatives.map(initiative => ({
    id: initiative.id,
    title: initiative.title,
    description: initiative.summary,
    status: initiative.status,
    rag: initiative.rag,
    team: initiative.team,
    updatedAt: initiative.updatedAt,
    createdAt: initiative.createdAt,
    _count: initiative._count,
  }))
}
