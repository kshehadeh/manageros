import { prisma } from '@/lib/db'
import { ActiveInitiativesSection } from './active-initiatives-section'
import type { Initiative } from '@/components/initiatives/initiative-list'

interface ActiveInitiativesSectionServerProps {
  organizationId: string
  personId: string | null
}

export async function ActiveInitiativesSectionServer({
  organizationId,
  personId,
}: ActiveInitiativesSectionServerProps) {
  if (!personId) {
    return null
  }

  // Fetch initiatives where current user is an owner
  const initiatives = await prisma.initiative.findMany({
    where: {
      organizationId,
      owners: {
        some: { personId },
      },
      status: {
        in: ['in_progress', 'planned'],
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
    take: 5,
  })

  // Transform the data to match the Initiative interface
  const transformedInitiatives: Initiative[] = initiatives.map(initiative => ({
    id: initiative.id,
    title: initiative.title,
    status: initiative.status,
    rag: initiative.rag,
    team: initiative.team,
    updatedAt: initiative.updatedAt,
    createdAt: initiative.createdAt,
    _count: initiative._count,
  }))

  return <ActiveInitiativesSection initiatives={transformedInitiatives} />
}
