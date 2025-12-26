import { prisma } from '@/lib/db'
import {
  SimpleInitiativeList,
  type Initiative,
} from '@/components/initiatives/initiative-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Rocket } from 'lucide-react'
import { InitiativesEmptyStateCard } from './initiatives-empty-state-card'
import { checkIfManagerOrSelf } from '@/lib/utils/people-utils'

interface OwnedInitiativesSectionProps {
  personId: string
  organizationId: string
  currentPersonId?: string | null
}

export async function OwnedInitiativesSection({
  personId,
  organizationId,
  currentPersonId,
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

  // Show empty state card if person has no initiatives
  // Only show if current user is a manager (direct or indirect) of this person
  if (initiatives.length === 0) {
    // Check if current user is a manager of this person
    const isManager =
      currentPersonId && currentPersonId !== personId
        ? await checkIfManagerOrSelf(currentPersonId, personId)
        : false

    // Only show empty state if user is a manager (not self)
    if (isManager && currentPersonId !== personId) {
      return (
        <InitiativesEmptyStateCard
          personId={personId}
          organizationId={organizationId}
          existingInitiativeIds={[]}
        />
      )
    }

    // If not a manager, return null (don't show empty state)
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
    <div className='flex-1 min-w-[300px]'>
      <PageSection
        header={<SectionHeader icon={Rocket} title='Owned Initiatives' />}
      >
        <SimpleInitiativeList
          initiatives={transformedInitiatives}
          variant='compact'
          emptyStateText='No initiatives found.'
        />
      </PageSection>
    </div>
  )
}
