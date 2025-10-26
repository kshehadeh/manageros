import { prisma } from '@/lib/db'
import {
  SimpleInitiativeList,
  type Initiative,
} from '@/components/initiatives/initiative-list'

interface OwnedInitiativesSectionProps {
  personId: string
  organizationId: string
}

export async function OwnedInitiativesSection({
  personId,
  organizationId,
}: OwnedInitiativesSectionProps) {
  if (!organizationId) {
    return null
  }

  // Get initiatives owned by this person
  const initiatives = await prisma.initiative.findMany({
    where: {
      organizationId,
      owners: {
        some: { personId },
      },
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          objectives: true,
          tasks: true,
          checkIns: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Only show if person has initiatives
  if (initiatives.length === 0) {
    return null
  }

  // Transform the data to match the Initiative interface
  const transformedInitiatives: Initiative[] = initiatives.map(initiative => ({
    id: initiative.id,
    title: initiative.title,
    description: initiative.summary, // Map summary to description
    status: initiative.status,
    rag: initiative.rag,
    team: initiative.team,
    updatedAt: initiative.updatedAt,
    createdAt: initiative.createdAt,
    _count: initiative._count,
  }))

  return (
    <SimpleInitiativeList
      initiatives={transformedInitiatives}
      title='Owned Initiatives'
      variant='compact'
      viewAllHref='/initiatives'
      emptyStateText='No initiatives found.'
    />
  )
}
