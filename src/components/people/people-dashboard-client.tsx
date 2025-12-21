'use client'

import { PeopleStatsCards } from '@/components/people/people-stats-cards'
import { PeopleBreakdownCharts } from '@/components/people/people-breakdown-charts'
import { PageSection } from '@/components/ui/page-section'
import type { PeopleStats } from '@/lib/actions/people-stats'

interface PeopleDashboardClientProps {
  stats: PeopleStats | null
  hasLinkedPerson: boolean
}

/**
 * Dashboard client component for the people page
 * Displays stats cards and breakdown charts
 * Future: Can accept dashboardConfig prop for widget customization
 */
export function PeopleDashboardClient({
  stats,
  hasLinkedPerson,
}: PeopleDashboardClientProps) {
  if (!stats) {
    return (
      <PageSection>
        <div className='text-center text-xs text-muted-foreground py-8 font-mono'>
          Unable to load dashboard statistics
        </div>
      </PageSection>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Stats Cards Section */}
      <PageSection>
        <PeopleStatsCards stats={stats} hasLinkedPerson={hasLinkedPerson} />
      </PageSection>

      {/* Charts Section */}
      <PageSection>
        <PeopleBreakdownCharts stats={stats} />
      </PageSection>
    </div>
  )
}
