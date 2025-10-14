'use client'

import { ExpandableSection } from '@/components/expandable-section'
import { OneOnOneDataTable } from '@/components/oneonones/data-table'

export function DashboardRecentOneOnOnesSection() {
  return (
    <ExpandableSection
      title='Recent 1:1s'
      icon='Handshake'
      viewAllHref='/oneonones'
    >
      <OneOnOneDataTable
        settingsId='dashboard-recent-oneonones'
        limit={10}
        hideFilters={true}
        immutableFilters={{}}
      />
    </ExpandableSection>
  )
}
