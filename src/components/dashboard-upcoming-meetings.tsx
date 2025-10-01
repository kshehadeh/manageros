'use client'

import { Calendar, Clock, Users } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type MeetingWithRelations = {
  id: string
  title: string
  description: string | null
  scheduledAt: Date
  duration: number | null
  location: string | null
  isRecurring: boolean
  recurrenceType: string | null
  team: {
    id: string
    name: string
  } | null
  initiative: {
    id: string
    title: string
  } | null
  owner: {
    id: string
    name: string
  } | null
  participants: Array<{
    person: {
      id: string
      name: string
    }
  }>
}

type MeetingInstanceWithRelations = {
  id: string
  scheduledAt: Date
  notes: string | null
  meeting: {
    id: string
    title: string
    description: string | null
    duration: number | null
    location: string | null
    team: {
      id: string
      name: string
    } | null
    initiative: {
      id: string
      title: string
    } | null
    owner: {
      id: string
      name: string
    } | null
    participants: Array<{
      person: {
        id: string
        name: string
      }
    }>
  }
  participants: Array<{
    person: {
      id: string
      name: string
    }
  }>
}

type UpcomingMeeting =
  | (MeetingWithRelations & { type: 'meeting' })
  | (MeetingInstanceWithRelations & { type: 'instance' })

interface DashboardUpcomingMeetingsProps {
  meetings: UpcomingMeeting[]
}

function formatDateTime(date: Date) {
  // Convert UTC date to local time for display
  const localDate = new Date(date)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(localDate)
}

function formatDuration(minutes: number | null) {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${mins}m`
}

export function DashboardUpcomingMeetings({
  meetings,
}: DashboardUpcomingMeetingsProps) {
  if (meetings.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground text-sm'>No upcoming meetings</p>
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='p-2'>Title</TableHead>
            <TableHead className='p-2'>Date/Time</TableHead>
            <TableHead className='p-2'>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {meetings.map(meeting => {
            const isInstance = meeting.type === 'instance'
            const meetingData = isInstance ? meeting.meeting : meeting
            const href = isInstance
              ? `/meetings/${meetingData.id}/instances/${meeting.id}`
              : `/meetings/${meeting.id}`

            const participantCount = isInstance
              ? Math.max(
                  meeting.participants.length,
                  meetingData.participants.length
                )
              : meeting.participants.length

            return (
              <TableRow
                key={`${meeting.type}-${meeting.id}`}
                className='hover:bg-accent/50 cursor-pointer'
                onClick={() => (window.location.href = href)}
              >
                <TableCell className='p-2'>
                  <div>
                    <div className='font-medium text-sm'>
                      {meetingData.title}
                    </div>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground mt-1'>
                      <div className='flex items-center gap-1'>
                        <Users className='h-3 w-3' />
                        {participantCount} participant
                        {participantCount !== 1 ? 's' : ''}
                      </div>
                      {meetingData.team && (
                        <span className='px-1.5 py-0.5 bg-secondary/50 rounded text-xs'>
                          {meetingData.team.name}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className='p-2'>
                  <div className='flex items-center gap-1 text-sm'>
                    <Calendar className='h-3 w-3 text-muted-foreground' />
                    <span className='font-semibold'>
                      {formatDateTime(meeting.scheduledAt)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className='p-2'>
                  {meetingData.duration ? (
                    <div className='flex items-center gap-1 text-sm'>
                      <Clock className='h-3 w-3 text-muted-foreground' />
                      {formatDuration(meetingData.duration)}
                    </div>
                  ) : (
                    <span className='text-muted-foreground text-sm'>—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
