'use client'

import {
  SharedMeetingsTable,
  type MeetingWithRelations,
  type UpcomingMeeting,
} from '@/components/shared-meetings-table'

interface DashboardUpcomingMeetingsProps {
  meetings: UpcomingMeeting[]
}

export function DashboardUpcomingMeetings({
  meetings,
}: DashboardUpcomingMeetingsProps) {
  return (
    <SharedMeetingsTable
      meetings={meetings as (MeetingWithRelations | UpcomingMeeting)[]}
      variant='dashboard'
      emptyStateMessage='No upcoming meetings'
    />
  )
}
