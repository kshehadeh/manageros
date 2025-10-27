import { prisma } from '@/lib/db'
import {
  SimpleInitiativeList,
  type Initiative,
} from '@/components/initiatives/initiative-list'

interface DashboardOpenInitiativesServerSectionProps {
  organizationId: string
  personId: string | null
}

export async function DashboardOpenInitiativesServerSection({
  organizationId,
  personId,
}: DashboardOpenInitiativesServerSectionProps) {
  // If user doesn't have a linked person record, return empty state
  if (!personId) {
    return (
      <SimpleInitiativeList
        initiatives={[]}
        title='Your Initiatives'
        variant='compact'
        viewAllHref='/initiatives'
        emptyStateText='Please link your account to a person record to see your initiatives.'
      />
    )
  }

  // Fetch initiatives where current user is an owner
  const initiatives = await prisma.initiative.findMany({
    where: {
      organizationId,
      owners: {
        some: { personId },
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

  return (
    <SimpleInitiativeList
      initiatives={transformedInitiatives}
      title='Your Initiatives'
      variant='compact'
      viewAllHref='/initiatives'
      emptyStateText='No initiatives assigned to you.'
    />
  )
}
