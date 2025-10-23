import { ExpandableSection } from '@/components/expandable-section'
import { prisma } from '@/lib/db'
import { InitiativeCard } from '@/components/initiatives/initiative-card'

interface DashboardOpenInitiativesServerSectionProps {
  organizationId: string
  personId: string
}

export async function DashboardOpenInitiativesServerSection({
  organizationId,
  personId,
}: DashboardOpenInitiativesServerSectionProps) {
  // Fetch initiatives where current user is an owner
  const initiatives = await prisma.initiative.findMany({
    where: {
      organizationId,
      owners: {
        some: { personId },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      team: {
        select: {
          name: true,
        },
      },
    },
  })

  return (
    <ExpandableSection
      title='Your Initiatives'
      icon='Rocket'
      viewAllHref='/initiatives'
    >
      {initiatives.length === 0 ? (
        <div className='text-neutral-400 text-sm'>
          No initiatives assigned to you.
        </div>
      ) : (
        initiatives.map(initiative => (
          <InitiativeCard key={initiative.id} initiative={initiative} />
        ))
      )}
    </ExpandableSection>
  )
}
