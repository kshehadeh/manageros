'use client'

import {
  type MeetingWithRelations,
  type UpcomingMeeting,
  type MeetingInstanceWithRelations,
} from '@/components/meetings/shared-meetings-table'
import { MeetingList, type Meeting } from '@/components/meetings/meeting-list'

interface DashboardUpcomingMeetingsProps {
  meetings: UpcomingMeeting[]
  onMeetingUpdate?: () => void
}

export function DashboardUpcomingMeetings({
  meetings,
  onMeetingUpdate,
}: DashboardUpcomingMeetingsProps) {
  // Transform UpcomingMeeting[] to Meeting[]
  const transformedMeetings: Meeting[] = meetings.map(meeting => {
    // Check if it's a meeting instance
    if ('type' in meeting && meeting.type === 'instance') {
      const instance = meeting as MeetingInstanceWithRelations & {
        type: 'instance'
      }
      return {
        id: `${instance.meeting.id}-${instance.id}`,
        title: instance.meeting.title,
        description: instance.meeting.description,
        scheduledAt: instance.scheduledAt,
        duration: instance.meeting.duration,
        location: instance.meeting.location,
        isRecurring: false, // instances are not recurring
        recurrenceType: null,
        isPrivate: false, // instances inherit from meeting
        team: instance.meeting.team,
        initiative: instance.meeting.initiative
          ? {
              id: instance.meeting.initiative.id,
              title: instance.meeting.initiative.title,
            }
          : null,
        owner: instance.meeting.owner,
        createdBy: null,
        participants: instance.participants.map(p => ({
          person: p.person,
          status: 'accepted',
        })),
      }
    } else {
      // It's a regular meeting
      const regularMeeting = meeting as MeetingWithRelations & {
        type: 'meeting'
      }
      return {
        id: regularMeeting.id,
        title: regularMeeting.title,
        description: regularMeeting.description,
        scheduledAt: regularMeeting.scheduledAt,
        duration: regularMeeting.duration,
        location: regularMeeting.location,
        isRecurring: regularMeeting.isRecurring,
        recurrenceType: regularMeeting.recurrenceType,
        isPrivate: regularMeeting.isPrivate,
        team: regularMeeting.team,
        initiative: regularMeeting.initiative
          ? {
              id: regularMeeting.initiative.id,
              title: regularMeeting.initiative.title,
            }
          : null,
        owner: regularMeeting.owner,
        createdBy: regularMeeting.createdBy
          ? {
              id: regularMeeting.createdBy.id,
              name: regularMeeting.createdBy.name,
            }
          : null,
        participants: regularMeeting.participants.map(p => ({
          person: p.person,
          status: p.status,
        })),
      }
    }
  })

  return (
    <MeetingList
      meetings={transformedMeetings}
      title='Upcoming Meetings'
      viewAllHref='/meetings'
      emptyStateText='No upcoming meetings'
      onMeetingUpdate={onMeetingUpdate}
    />
  )
}
