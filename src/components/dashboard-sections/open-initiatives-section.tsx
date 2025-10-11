import { InitiativeDataTable } from '@/components/initiatives/data-table'
import { ExpandableSection } from '@/components/expandable-section'
import { getCurrentUser } from '@/lib/auth-utils'

interface DashboardOpenInitiativesSectionProps {
  organizationId: string
}

export async function DashboardOpenInitiativesSection({
  organizationId: _organizationId,
}: DashboardOpenInitiativesSectionProps) {
  const user = await getCurrentUser()

  return (
    <ExpandableSection
      title='Your Initiatives'
      icon='Rocket'
      viewAllHref='/initiatives'
    >
      <InitiativeDataTable
        hideFilters={true}
        enablePagination={false}
        limit={10}
        immutableFilters={{
          status: 'planned,active',
          ownerId: user.personId || '',
        }}
        settingsId='dashboard-initiatives'
      />
    </ExpandableSection>
  )
}
