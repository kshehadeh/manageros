'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  Calendar,
  CalendarCheck,
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
import { useMeetings } from '@/hooks/use-meetings'
import { useMeetingTableSettings } from '@/hooks/use-meeting-table-settings'
import { deleteMeeting } from '@/lib/actions/meeting'
import type { DataTableConfig } from '@/components/common/generic-data-table'

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

type MeetingFilters = {
  scheduledFrom?: string
  scheduledTo?: string
  search?: string
  teamId?: string
  initiativeId?: string
}

export const meetingDataTableConfig: DataTableConfig<
  UpcomingMeeting,
  MeetingFilters
> = {
  // Entity identification
  entityType: 'meeting',
  entityName: 'Meeting',
  entityNamePlural: 'Meetings',

  // Data fetching
  useDataHook: useMeetings,

  // Settings management
  useSettingsHook: useMeetingTableSettings,

  // Custom ID extraction for meetings (handles both regular meetings and instances)
  getId: entity => {
    const isInstance = 'type' in entity && entity.type === 'instance'
    if (isInstance) {
      // For meeting instances, return a composite ID: meetingId-instanceId
      const instance = entity as MeetingInstanceWithRelations
      return `${instance.meeting.id}-${instance.id}`
    }
    return (entity as MeetingWithRelations).id
  },

  onEdit: (router, { entityId }) => {
    router.push(`/meetings/${entityId}/edit`)
  },

  onViewDetails: (router, { entityId }) => {
    router.push(`/meetings/${entityId}`)
  },

  // Custom row click handler for meetings (handles different meeting types)
  onRowClick: (router, entityId, _extra) => {
    // For meetings, we need to handle the navigation manually since meeting instances
    // have a different route structure than regular meetings
    if (typeof window !== 'undefined') {
      // Check if this is a composite ID (meetingId-instanceId)
      if (entityId.includes('-')) {
        const [meetingId, instanceId] = entityId.split('-')
        window.location.href = `/meetings/${meetingId}/instances/${instanceId}`
      } else {
        window.location.href = `/meetings/${entityId}`
      }
    }
  },

  // Column definitions
  createColumns: ({ onButtonClick, grouping, visibleColumns }) => {
    // Check if we're grouped by team to hide the team column
    const isGroupedByTeam = grouping && grouping.includes('team')

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

          const MeetingIcon = isInstance ? CalendarCheck : Calendar

          return (
            <div className='space-y-0.5 flex-1'>
              <div className='flex items-center gap-2'>
                <MeetingIcon className='h-4 w-4 text-muted-foreground' />
                <div className='font-medium'>{meetingData.title}</div>
              </div>
              <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Users className='h-3 w-3' />
                  {participantCount} participant
                  {participantCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )
        },
        meta: {
          hidden: visibleColumns?.includes('title') === false,
        },
      },
      {
        id: 'team',
        header: () => (
          <div className='flex items-center gap-2'>
            <Building2 className='h-4 w-4' />
            Team
          </div>
        ),
        accessorFn: row => {
          const isInstance = row.type === 'instance'
          if (isInstance) {
            return (
              (row as MeetingInstanceWithRelations).meeting.team?.name || '—'
            )
          }
          return (row as MeetingWithRelations).team?.name || '—'
        },
        cell: ({ row }) => {
          const meeting = row.original
          const isInstance = meeting.type === 'instance'
          const team = isInstance
            ? (meeting as MeetingInstanceWithRelations).meeting.team
            : (meeting as MeetingWithRelations).team

          if (!team) {
            return <span className='text-muted-foreground'>—</span>
          }

          return (
            <Link
              href={`/teams/${team.id}`}
              className='text-primary hover:text-primary/90 transition-colors'
              onClick={e => e.stopPropagation()}
            >
              {team.name}
            </Link>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden: visibleColumns?.includes('team') === false || isGroupedByTeam,
        },
      },
      {
        id: 'date',
        header: 'Date',
        accessorFn: row => {
          const isInstance = row.type === 'instance'
          if (isInstance) {
            return (row as MeetingInstanceWithRelations).scheduledAt
          }
          return (row as MeetingWithRelations).scheduledAt
        },
        cell: ({ row }) => {
          const meeting = row.original
          const isInstance = meeting.type === 'instance'
          const scheduledAt = isInstance
            ? (meeting as MeetingInstanceWithRelations).scheduledAt
            : (meeting as MeetingWithRelations).scheduledAt

          return (
            <div className='flex flex-col'>
              <span className='text-muted-foreground'>
                {formatDate(scheduledAt)}
              </span>
              <span className='text-xs text-muted-foreground'>
                {formatTime(scheduledAt)}
              </span>
            </div>
          )
        },
        size: 120,
        minSize: 100,
        maxSize: 150,
        meta: {
          hidden: visibleColumns?.includes('date') === false,
        },
      },
      {
        id: 'duration',
        header: () => (
          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4' />
            Duration
          </div>
        ),
        accessorFn: row => {
          const isInstance = row.type === 'instance'
          if (isInstance) {
            return (row as MeetingInstanceWithRelations).meeting.duration
          }
          return (row as MeetingWithRelations).duration
        },
        cell: ({ row }) => {
          const meeting = row.original
          const isInstance = meeting.type === 'instance'
          const duration = isInstance
            ? (meeting as MeetingInstanceWithRelations).meeting.duration
            : (meeting as MeetingWithRelations).duration

          return (
            <span className='text-muted-foreground'>
              {formatDuration(duration)}
            </span>
          )
        },
        size: 100,
        minSize: 80,
        maxSize: 120,
        meta: {
          hidden: visibleColumns?.includes('duration') === false,
        },
      },
      {
        id: 'initiative',
        header: () => (
          <div className='flex items-center gap-2'>
            <Target className='h-4 w-4' />
            Initiative
          </div>
        ),
        accessorFn: row => {
          const isInstance = row.type === 'instance'
          if (isInstance) {
            return (
              (row as MeetingInstanceWithRelations).meeting.initiative?.title ||
              '—'
            )
          }
          return (row as MeetingWithRelations).initiative?.title || '—'
        },
        cell: ({ row }) => {
          const meeting = row.original
          const isInstance = meeting.type === 'instance'
          const initiative = isInstance
            ? (meeting as MeetingInstanceWithRelations).meeting.initiative
            : (meeting as MeetingWithRelations).initiative

          if (!initiative) {
            return <span className='text-muted-foreground'>—</span>
          }

          return (
            <Link
              href={`/initiatives/${initiative.id}`}
              className='text-primary hover:text-primary/90 transition-colors'
              onClick={e => e.stopPropagation()}
            >
              {initiative.title}
            </Link>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden: visibleColumns?.includes('initiative') === false,
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
            : (meeting as MeetingWithRelations).id

          return (
            <div className='flex items-center justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={e => {
                  e.stopPropagation()
                  onButtonClick(e, meetingId, isInstance)
                }}
              >
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </div>
          )
        },
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableSorting: false,
        enableHiding: false,
        meta: {
          hidden: false,
        },
      },
    ]
  },

  // Actions
  deleteAction: deleteMeeting,

  // UI configuration
  searchPlaceholder: 'Search meetings...',
  emptyMessage: 'No meetings found',
  loadingMessage: 'Loading meetings...',

  // Grouping and sorting options
  groupingOptions: [
    { value: 'none', label: 'No grouping' },
    { value: 'team', label: 'Group by team' },
    { value: 'initiative', label: 'Group by initiative' },
    { value: 'date', label: 'Group by date' },
  ],
  sortOptions: [
    { value: 'title', label: 'Title' },
    { value: 'date', label: 'Date' },
    { value: 'duration', label: 'Duration' },
  ],
}
