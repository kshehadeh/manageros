'use client'

import { useMemo } from 'react'
import { DashboardUpcomingMeetings } from '@/components/meetings/dashboard-upcoming-meetings'
import { ExpandableSection } from '@/components/expandable-section'
import { useMeetings } from '@/hooks/use-meetings'
import { useSession } from 'next-auth/react'

export function DashboardUpcomingMeetingsSection() {
  const { status } = useSession()

  // Memoize date calculations to prevent infinite loop
  const dateFilters = useMemo(() => {
    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return {
      scheduledFrom: new Date(now.toISOString()).toISOString(),
      scheduledTo: new Date(oneWeekFromNow.toISOString()).toISOString(),
    }
  }, []) // Empty deps array - only calculate once on mount

  const { data, loading, error } = useMeetings({
    immutableFilters: dateFilters,
    limit: 5,
    enabled: status !== 'loading',
  })

  if (loading || status === 'loading') {
    return (
      <ExpandableSection title='Upcoming Meetings' viewAllHref='/meetings'>
        <div className='flex items-center justify-center py-8'>
          <div className='text-muted-foreground'>Loading...</div>
        </div>
      </ExpandableSection>
    )
  }

  if (error) {
    console.error('Error loading upcoming meetings:', error)
    return null
  }

  const allUpcomingMeetings = data?.meetings || []

  if (!allUpcomingMeetings || allUpcomingMeetings.length === 0) return null

  return (
    <ExpandableSection title='Upcoming Meetings' viewAllHref='/meetings'>
      <DashboardUpcomingMeetings meetings={allUpcomingMeetings} />
    </ExpandableSection>
  )
}
