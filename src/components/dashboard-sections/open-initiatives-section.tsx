'use client'

import { useMemo } from 'react'
import { InitiativeDataTable } from '@/components/initiatives/data-table'
import { ExpandableSection } from '@/components/expandable-section'
import { useSession } from 'next-auth/react'

interface DashboardOpenInitiativesSectionProps {
  organizationId: string
}

export function DashboardOpenInitiativesSection({
  organizationId: _organizationId,
}: DashboardOpenInitiativesSectionProps) {
  const { data: session } = useSession()
  const personId = (session?.user as { personId?: string })?.personId

  // Memoize immutableFilters to prevent infinite loop
  const immutableFilters = useMemo(
    () => ({
      status: 'planned,active',
      ownerId: personId || '',
    }),
    [personId]
  )

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
        visibleColumns={['rag', 'title', 'teamName', 'statusBadge']}
        immutableFilters={immutableFilters}
        settingsId='dashboard-initiatives'
      />
    </ExpandableSection>
  )
}
