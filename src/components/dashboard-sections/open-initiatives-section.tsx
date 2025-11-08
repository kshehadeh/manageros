'use client'

import { useMemo, useState, useEffect } from 'react'
import { InitiativeDataTable } from '@/components/initiatives/data-table'
import { ExpandableSection } from '@/components/expandable-section'
import { useUser } from '@clerk/nextjs'

interface DashboardOpenInitiativesSectionProps {
  organizationId: string
}

export function DashboardOpenInitiativesSection({
  organizationId: _organizationId,
}: DashboardOpenInitiativesSectionProps) {
  const { user, isLoaded } = useUser()
  const [userData, setUserData] = useState<{ personId?: string } | null>(null)

  useEffect(() => {
    if (isLoaded && user) {
      fetch('/api/user/current')
        .then(res => res.json())
        .then(data => setUserData(data.user))
        .catch(() => {})
    }
  }, [isLoaded, user])

  const currentPersonId = userData?.personId
  const personId = currentPersonId

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
