'use client'

import React from 'react'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MoreHorizontal, Target, Building2, Clock } from 'lucide-react'
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

// Get relative date group for a given date
function getRelativeDateGroup(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return 'invalid'

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const meetingDate = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate()
  )

  const diffTime = today.getTime() - meetingDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  // Future dates
  if (diffDays < 0) {
    return '0-today'
  }

  // Today
  if (diffDays === 0) {
    return '0-today'
  }

  // Yesterday
  if (diffDays === 1) {
    return '1-yesterday'
  }

  // Last 7 days (excluding yesterday)
  if (diffDays <= 7) {
    return '2-last-week'
  }

  // Last 30 days (excluding last week)
  if (diffDays <= 30) {
    return '3-last-month'
  }

  // Everything else
  return '4-older'
}

// Format relative date group label
function formatRelativeDateGroupLabel(groupKey: string): string {
  switch (groupKey) {
    case '0-today':
      return 'Today'
    case '1-yesterday':
      return 'Yesterday'
    case '2-last-week':
      return 'Last Week'
    case '3-last-month':
      return 'Last Month'
    case '4-older':
      return 'Older'
    default:
      return groupKey
  }
}

type MeetingFilters = {
  scheduledFrom?: string
  scheduledTo?: string
  search?: string
  teamId?: string
  initiativeId?: string
  meetingType?: string
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
    // Check if this is a composite ID (meetingId-instanceId)
    if (entityId.includes('-')) {
      const [meetingId, instanceId] = entityId.split('-')
      router.push(`/meetings/${meetingId}/instances/${instanceId}`)
    } else {
      router.push(`/meetings/${entityId}`)
    }
  },

  // Column definitions
  createColumns: ({ onButtonClick, grouping, visibleColumns }) => {
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

          const scheduledAt = isInstance
            ? (meeting as MeetingInstanceWithRelations).scheduledAt
            : (meeting as MeetingWithRelations).scheduledAt

          const duration = isInstance
            ? (meeting as MeetingInstanceWithRelations).meeting.duration
            : (meeting as MeetingWithRelations).duration

          const initiative = isInstance
            ? (meeting as MeetingInstanceWithRelations).meeting.initiative
            : (meeting as MeetingWithRelations).initiative

          // Build subheader text with date, duration, and initiative
          const subheaderParts: string[] = []

          // Add date and time
          subheaderParts.push(
            `${formatDate(scheduledAt)} at ${formatTime(scheduledAt)}`
          )

          // Add duration if available
          if (duration) {
            subheaderParts.push(formatDuration(duration))
          }

          // Add initiative if available
          if (initiative) {
            subheaderParts.push(initiative.title)
          }

          return (
            <div className='space-y-0.5 flex-1'>
              <div className='font-medium'>{meetingData.title}</div>
              <div className='text-xs text-muted-foreground'>
                {subheaderParts.join(' • ')}
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
              className='text-primary hover:text-highlight/90 transition-colors'
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
          hidden: true,
        },
      },
      {
        id: 'date',
        header: 'Date',
        accessorFn: row => {
          const isInstance = row.type === 'instance'
          const scheduledAt = isInstance
            ? (row as MeetingInstanceWithRelations).scheduledAt
            : (row as MeetingWithRelations).scheduledAt

          // When grouping by date, return the relative date group
          // Otherwise return the actual date for sorting
          if (grouping && grouping.includes('date')) {
            return getRelativeDateGroup(scheduledAt)
          }
          return scheduledAt
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
          hidden: true,
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
          hidden: true,
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
              className='text-primary hover:text-highlight/90 transition-colors'
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
          hidden: true,
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
    { value: 'scheduledAt', label: 'Date' },
    { value: 'duration', label: 'Duration' },
  ],

  // Filter configuration
  filterContent: ({ settings, updateFilters }) => (
    <div className='space-y-3'>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Meeting Type</label>
        <Select
          value={settings.filters.meetingType || 'all'}
          onValueChange={value => {
            if (value === 'all') {
              updateFilters({ meetingType: undefined })
            } else {
              updateFilters({ meetingType: value })
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder='All meetings' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All meetings</SelectItem>
            <SelectItem value='non-recurring'>Non-recurring only</SelectItem>
            <SelectItem value='recurring'>Recurring only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),

  hasActiveFiltersFn: filters => {
    return (
      filters.search !== '' ||
      filters.teamId !== '' ||
      filters.initiativeId !== '' ||
      filters.meetingType !== '' ||
      filters.meetingType !== undefined ||
      filters.scheduledFrom !== '' ||
      filters.scheduledTo !== ''
    )
  },

  clearFiltersFn: () => ({
    search: '',
    teamId: '',
    initiativeId: '',
    meetingType: undefined,
    scheduledFrom: '',
    scheduledTo: '',
  }),

  // Custom group label formatting
  getGroupLabel: (groupValue: string, groupingColumn: string) => {
    if (groupingColumn === 'date') {
      return formatRelativeDateGroupLabel(groupValue)
    }
    return groupValue || 'Unassigned'
  },
}
