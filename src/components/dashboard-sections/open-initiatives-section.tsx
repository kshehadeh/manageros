'use client'

import { useMemo } from 'react'
import { InitiativeDataTable } from '@/components/initiatives/data-table'
import { ExpandableSection } from '@/components/expandable-section'
import { useUser } from '@clerk/nextjs'
import { UserBrief } from '../../lib/auth-types'

interface DashboardOpenInitiativesSectionProps {
  organizationId: string
}

export function DashboardOpenInitiativesSection({
  organizationId: _organizationId,
}: DashboardOpenInitiativesSectionProps) {
  const { user } = useUser()

  // Get person ID from Clerk user metadata (no API call needed)
  const personId = (user?.publicMetadata as UserBrief)?.managerOSPersonId

  // Memoize immutableFilters to prevent infinite loop
  const immutableFilters = useMemo(
    () => ({
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
