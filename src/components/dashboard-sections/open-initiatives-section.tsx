import { prisma } from '@/lib/db'
import { InitiativesTable } from '@/components/initiatives/initiatives-table'
import { ExpandableSection } from '@/components/expandable-section'
import { getInitiativesForCurrentUser } from '@/lib/actions/initiative'

interface DashboardOpenInitiativesSectionProps {
  organizationId: string
}

export async function DashboardOpenInitiativesSection({
  organizationId,
}: DashboardOpenInitiativesSectionProps) {
  const openInitiatives = await getInitiativesForCurrentUser()

  // Get people and teams for the table
  const [people, teams] = await Promise.all([
    prisma.person.findMany({
      where: { organizationId },
    }),
    prisma.team.findMany({
      where: { organizationId },
    }),
  ])

  if (!openInitiatives || openInitiatives.length === 0) return null

  return (
    <ExpandableSection
      title='Your Initiatives'
      icon='Rocket'
      viewAllHref='/initiatives'
    >
      <InitiativesTable
        initiatives={openInitiatives}
        people={people}
        teams={teams}
        hideFilters={true}
        hideOwner={true}
        hideActions={true}
      />
    </ExpandableSection>
  )
}
