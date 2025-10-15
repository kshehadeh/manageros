'use client'

import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  Calendar,
  Target,
  Building2,
  Clock,
  Users,
} from 'lucide-react'
import type {
  UpcomingMeeting,
  MeetingWithRelations,
  MeetingInstanceWithRelations,
} from '@/components/meetings/shared-meetings-table'

interface CreateColumnsProps {
  onButtonClick?: (
    _e: React.MouseEvent,
    _meetingId: string,
    _isInstance?: boolean
  ) => void
  grouping?: string[]
}

// Utility functions
function formatDate(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return '—'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj)
}

function formatTime(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return '—'

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(dateObj)
}

function formatDuration(minutes: number | null) {
  if (!minutes) return '—'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return `${mins}m`
}

export function createMeetingColumns({
  onButtonClick,
  grouping = [],
}: CreateColumnsProps): ColumnDef<UpcomingMeeting>[] {
  return [
    {
      accessorKey: 'title',
      header: 'Title',
      size: 500,
      minSize: 300,
      maxSize: 1000,
      accessorFn: row => {
        const isInstance = row.type === 'instance'
        if (isInstance) {
          return (row as MeetingInstanceWithRelations).meeting.title
        }
        return (row as MeetingWithRelations).title
      },
      cell: ({ row }) => {
        const meeting = row.original
        const isInstance = meeting.type === 'instance'
        const meetingData = isInstance
          ? (meeting as MeetingInstanceWithRelations).meeting
          : (meeting as MeetingWithRelations)

        const participantCount = isInstance
          ? Math.max(
              (meeting as MeetingInstanceWithRelations).participants.length,
              (meeting as MeetingInstanceWithRelations).meeting.participants
                .length
            )
          : (meeting as MeetingWithRelations).participants.length

        return (
          <div className='flex items-start gap-3'>
            <div className='space-y-0.5 flex-1'>
              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                <span>{meetingData.title}</span>
              </div>
              <div className='text-xs text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap ml-6'>
                <div className='flex items-center gap-1'>
                  <Clock className='h-3 w-3' />
                  {formatTime(meeting.scheduledAt)}
                </div>
                {meetingData.duration && (
                  <div className='flex items-center gap-1'>
                    <Clock className='h-3 w-3' />
                    {formatDuration(meetingData.duration)}
                  </div>
                )}
                <div className='flex items-center gap-1'>
                  <Users className='h-3 w-3' />
                  {participantCount} participant
                  {participantCount !== 1 ? 's' : ''}
                </div>
                {meetingData.team && !grouping.includes('team') && (
                  <div className='flex items-center gap-1'>
                    <Building2 className='h-3 w-3' />
                    <Link
                      href={`/teams/${meetingData.team.id}`}
                      className='text-primary hover:text-primary/80 transition-colors'
                      onClick={e => e.stopPropagation()}
                    >
                      {meetingData.team.name}
                    </Link>
                  </div>
                )}
                {meetingData.initiative && !grouping.includes('initiative') && (
                  <div className='flex items-center gap-1'>
                    <Target className='h-3 w-3' />
                    <Link
                      href={`/initiatives/${meetingData.initiative.id}`}
                      className='text-primary hover:text-primary/80 transition-colors'
                      onClick={e => e.stopPropagation()}
                    >
                      {meetingData.initiative.title}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'scheduledAt',
      header: 'Date',
      size: 150,
      minSize: 100,
      maxSize: 200,
      cell: ({ row }) => {
        const meeting = row.original
        return (
          <div className='text-muted-foreground'>
            <div className='font-medium'>{formatDate(meeting.scheduledAt)}</div>
            <div className='text-sm'>{formatTime(meeting.scheduledAt)}</div>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const meeting = row.original
        const isInstance = meeting.type === 'instance'
        const meetingId = isInstance
          ? `${(meeting as MeetingInstanceWithRelations).meeting.id}-${meeting.id}`
          : meeting.id

        return (
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
            onClick={e => {
              e.stopPropagation()
              if (onButtonClick) {
                onButtonClick(e, meetingId, isInstance)
              }
            }}
          >
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        )
      },
      enableGrouping: false,
      size: 60,
      minSize: 50,
      maxSize: 100,
    },
    // Hidden columns for grouping
    {
      id: 'team',
      header: 'Team',
      accessorFn: row => {
        const isInstance = row.type === 'instance'
        const meetingData = isInstance
          ? (row as MeetingInstanceWithRelations).meeting
          : (row as MeetingWithRelations)
        return meetingData.team?.name || 'No Team'
      },
      cell: ({ row }) => {
        const meeting = row.original
        const isInstance = meeting.type === 'instance'
        const meetingData = isInstance
          ? (meeting as MeetingInstanceWithRelations).meeting
          : (meeting as MeetingWithRelations)
        return meetingData.team?.name || 'No Team'
      },
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
    {
      id: 'initiative',
      header: 'Initiative',
      accessorFn: row => {
        const isInstance = row.type === 'instance'
        const meetingData = isInstance
          ? (row as MeetingInstanceWithRelations).meeting
          : (row as MeetingWithRelations)
        return meetingData.initiative?.title || 'No Initiative'
      },
      cell: ({ row }) => {
        const meeting = row.original
        const isInstance = meeting.type === 'instance'
        const meetingData = isInstance
          ? (meeting as MeetingInstanceWithRelations).meeting
          : (meeting as MeetingWithRelations)
        return meetingData.initiative?.title || 'No Initiative'
      },
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
  ]
}
