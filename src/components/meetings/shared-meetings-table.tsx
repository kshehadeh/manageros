'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal,
  Target,
  Calendar,
  CalendarCheck,
  Building2,
  Clock,
  Users,
  Plus,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { deleteMeeting } from '@/lib/actions/meeting'
import { toast } from 'sonner'
import { DeleteModal } from '@/components/common/delete-modal'
import { Meeting, Team, Person, User as PrismaUser } from '@prisma/client'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import {
  ViewDetailsMenuItem,
  EditMenuItem,
  DeleteMenuItem,
} from '@/components/common/context-menu-items'
import { dataTableStyles } from '@/components/common/data-table-styles'

export type MeetingWithRelations = Meeting & {
  team: Team | null
  initiative: { id: string; title: string } | null
  owner: Person | null
  createdBy: PrismaUser | null
  participants: Array<{
    person: Person
    status: string
  }>
}

export type MeetingInstanceWithRelations = {
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

export type UpcomingMeeting =
  | (MeetingWithRelations & { type: 'meeting' })
  | (MeetingInstanceWithRelations & { type: 'instance' })

// Column configuration types
export type MeetingColumnType =
  | 'title'
  | 'dateTime'
  | 'time'
  | 'scheduled'
  | 'duration'
  | 'team'
  | 'initiative'
  | 'participants'
  | 'actions'

export interface MeetingColumnConfig {
  type: MeetingColumnType
  header: string
  show?: boolean
  width?: string
}

export interface SharedMeetingsTableProps {
  meetings: (MeetingWithRelations | UpcomingMeeting)[]
  filteredMeetings?: MeetingWithRelations[]
  columns?: MeetingColumnConfig[]
  enableRightClick?: boolean
  rowClickHandler?: (_meetingId: string, _isInstance?: boolean) => void
  emptyStateMessage?: string
  emptyStateAction?: {
    label: string
    onClick: () => void
  }
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

function formatDateTime(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return '—'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

function getStatusBadge(meeting: MeetingWithRelations) {
  const now = new Date()
  const scheduledAt = new Date(meeting.scheduledAt)

  if (scheduledAt < now) {
    return <Badge variant='secondary'>Past</Badge>
  }

  const timeDiff = scheduledAt.getTime() - now.getTime()
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

  if (daysDiff === 0) {
    return <Badge variant='default'>Today</Badge>
  } else if (daysDiff === 1) {
    return <Badge variant='outline'>Tomorrow</Badge>
  } else if (daysDiff <= 7) {
    return <Badge variant='outline'>This Week</Badge>
  }

  return <Badge variant='outline'>Upcoming</Badge>
}

// Cell rendering functions
function renderTitleCell(
  meeting: MeetingWithRelations | UpcomingMeeting,
  showBadge = false,
  router?: ReturnType<typeof useRouter>
) {
  const isInstance = 'type' in meeting && meeting.type === 'instance'
  const meetingData = isInstance
    ? (meeting as MeetingInstanceWithRelations).meeting
    : (meeting as MeetingWithRelations)

  const MeetingIcon = isInstance ? CalendarCheck : Calendar

  return (
    <TableCell className='font-medium text-foreground'>
      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <MeetingIcon className='h-4 w-4 text-muted-foreground flex-shrink-0' />
          <button
            onClick={e => {
              e.stopPropagation()
              if (router) {
                router.push(`/meetings/${meetingData.id}`)
              }
            }}
            className='text-left hover:text-blue-600 hover:underline transition-colors'
          >
            {meetingData.title}
            {isInstance && (
              <span className='text-muted-foreground'> (instance)</span>
            )}
          </button>
        </div>
        {showBadge && (
          <div className='flex items-center gap-3 text-xs text-muted-foreground ml-6'>
            {isInstance && (
              <div className='flex items-center gap-1'>
                <Calendar className='h-3 w-3' />
                <button
                  onClick={e => {
                    e.stopPropagation()
                    if (router) {
                      router.push(`/meetings/${meetingData.id}`)
                    }
                  }}
                  className='text-primary hover:text-primary/80 transition-colors'
                >
                  View parent meeting
                </button>
              </div>
            )}
            {getStatusBadge(meeting as MeetingWithRelations)}
            <div className='flex items-center gap-1'>
              <Clock className='h-3 w-3 flex-shrink-0' />
              {formatDuration(meetingData.duration)}
            </div>
            <div className='flex items-center gap-1'>
              <Users className='h-3 w-3 flex-shrink-0' />
              {isInstance
                ? Math.max(
                    (meeting as MeetingInstanceWithRelations).participants
                      .length,
                    meetingData.participants.length
                  )
                : meeting.participants.length}{' '}
              participant
              {(isInstance
                ? Math.max(
                    (meeting as MeetingInstanceWithRelations).participants
                      .length,
                    meetingData.participants.length
                  )
                : meeting.participants.length) !== 1
                ? 's'
                : ''}
            </div>
          </div>
        )}
      </div>
    </TableCell>
  )
}

function renderDateTimeCell(meeting: MeetingWithRelations | UpcomingMeeting) {
  return (
    <TableCell>
      <div className='flex items-center gap-1 text-sm'>
        <Calendar className='h-3 w-3 text-muted-foreground flex-shrink-0' />
        <span className='font-semibold'>
          {formatDateTime(meeting.scheduledAt)}
        </span>
      </div>
    </TableCell>
  )
}

function renderScheduledCell(meeting: MeetingWithRelations | UpcomingMeeting) {
  return (
    <TableCell className='text-muted-foreground'>
      <div className='font-medium'>{formatDate(meeting.scheduledAt)}</div>
    </TableCell>
  )
}

function renderTimeCell(meeting: MeetingWithRelations | UpcomingMeeting) {
  return (
    <TableCell className='text-muted-foreground'>
      <div className='space-y-1'>
        <div className='font-medium'>{formatDate(meeting.scheduledAt)}</div>
        <div className='text-sm'>{formatTime(meeting.scheduledAt)}</div>
      </div>
    </TableCell>
  )
}

function renderDurationCell(meeting: MeetingWithRelations | UpcomingMeeting) {
  const isInstance = 'type' in meeting && meeting.type === 'instance'
  const meetingData = isInstance
    ? (meeting as MeetingInstanceWithRelations).meeting
    : (meeting as MeetingWithRelations)

  return (
    <TableCell className='text-muted-foreground'>
      {meetingData.duration ? (
        <div className='flex items-center gap-1 text-sm'>
          <Clock className='h-3 w-3 text-muted-foreground flex-shrink-0' />
          {formatDuration(meetingData.duration)}
        </div>
      ) : (
        <span className='text-muted-foreground text-sm'>—</span>
      )}
    </TableCell>
  )
}

function renderTeamCell(meeting: MeetingWithRelations | UpcomingMeeting) {
  const isInstance = 'type' in meeting && meeting.type === 'instance'
  const meetingData = isInstance
    ? (meeting as MeetingInstanceWithRelations).meeting
    : (meeting as MeetingWithRelations)

  return (
    <TableCell className='text-muted-foreground'>
      {meetingData.team ? (
        <div className='flex items-center gap-1'>
          <Building2 className='h-3 w-3 flex-shrink-0' />
          <span className='px-1.5 py-0.5 bg-secondary/50 rounded text-xs'>
            {meetingData.team.name}
          </span>
        </div>
      ) : (
        '—'
      )}
    </TableCell>
  )
}

function renderInitiativeCell(meeting: MeetingWithRelations | UpcomingMeeting) {
  const isInstance = 'type' in meeting && meeting.type === 'instance'
  const meetingData = isInstance
    ? (meeting as MeetingInstanceWithRelations).meeting
    : (meeting as MeetingWithRelations)

  return (
    <TableCell className='text-muted-foreground'>
      {meetingData.initiative ? (
        <div className='flex items-center gap-1'>
          <Target className='h-3 w-3 flex-shrink-0' />
          {meetingData.initiative.title}
        </div>
      ) : (
        '—'
      )}
    </TableCell>
  )
}

function renderParticipantsCell(
  meeting: MeetingWithRelations | UpcomingMeeting
) {
  const isInstance = 'type' in meeting && meeting.type === 'instance'
  const participantCount = isInstance
    ? Math.max(
        (meeting as MeetingInstanceWithRelations).participants.length,
        (meeting as MeetingInstanceWithRelations).meeting.participants.length
      )
    : meeting.participants.length

  return (
    <TableCell className='text-muted-foreground'>
      <div className='flex items-center gap-1'>
        <Users className='h-3 w-3 flex-shrink-0' />
        {participantCount} participant
        {participantCount !== 1 ? 's' : ''}
      </div>
    </TableCell>
  )
}

function renderActionsCell(
  meeting: MeetingWithRelations | UpcomingMeeting,
  onClick: (_e: React.MouseEvent) => void
) {
  return (
    <TableCell>
      <Button variant='ghost' className='h-8 w-8 p-0' onClick={onClick}>
        <MoreHorizontal className='h-4 w-4' />
      </Button>
    </TableCell>
  )
}

export function SharedMeetingsTable({
  meetings,
  filteredMeetings,
  columns,
  enableRightClick = false,
  rowClickHandler,
  emptyStateMessage,
  emptyStateAction,
}: SharedMeetingsTableProps) {
  const [_isPending, startTransition] = useTransition()
  const router = useRouter()
  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const handleDelete = async (meetingId: string) => {
    await deleteMeeting(meetingId)
    toast.success('Meeting deleted successfully')
    startTransition(() => {
      router.refresh()
    })
  }

  const handleRowClick = (meetingId: string, isInstance = false) => {
    if (rowClickHandler) {
      rowClickHandler(meetingId, isInstance)
    } else {
      // Default behavior: navigate to meeting detail page
      const href = isInstance
        ? `/meetings/${meetingId.split('-')[0]}/instances/${meetingId.split('-')[1]}`
        : `/meetings/${meetingId}`
      router.push(href)
    }
  }

  const handleRowRightClick = (e: React.MouseEvent, meetingId: string) => {
    if (enableRightClick) {
      e.preventDefault()
      // For right-click, manually position at mouse
      handleButtonClick(
        {
          ...e,
          currentTarget: e.currentTarget,
        } as React.MouseEvent,
        meetingId
      )
    }
  }

  // Use the provided columns or default configuration
  const finalColumns = columns || [
    { type: 'title', header: 'Title' },
    { type: 'scheduled', header: 'Scheduled' },
    { type: 'duration', header: 'Duration' },
    { type: 'team', header: 'Team' },
    { type: 'initiative', header: 'Initiative' },
    { type: 'actions', header: 'Actions', width: '50px' },
  ]

  // Determine which meetings to display
  const displayMeetings = filteredMeetings || meetings

  // Handle empty state
  if (displayMeetings.length === 0) {
    return (
      <div className='text-center py-8'>
        <Calendar className='h-8 w-8 text-muted-foreground mx-auto mb-4' />
        <p className='text-muted-foreground text-sm mb-4'>
          {emptyStateMessage || '; meetings scheduled.'}
        </p>
        {emptyStateAction && (
          <Button onClick={emptyStateAction.onClick} variant='outline'>
            <Plus className='h-4 w-4 mr-2' />
            {emptyStateAction.label}
          </Button>
        )}
      </div>
    )
  }

  // Column cell rendering function
  const renderColumnCell = (
    column: MeetingColumnConfig,
    meeting: MeetingWithRelations | UpcomingMeeting
  ) => {
    const isInstance = 'type' in meeting && meeting.type === 'instance'
    const meetingId = isInstance
      ? `${(meeting as MeetingInstanceWithRelations).meeting.id}-${meeting.id}`
      : meeting.id

    switch (column.type) {
      case 'title':
        return renderTitleCell(
          meeting,
          finalColumns.some(col => col.type === 'participants' && col.show),
          router
        )
      case 'dateTime':
        return renderDateTimeCell(meeting)
      case 'time':
        return renderTimeCell(meeting)
      case 'scheduled':
        return renderScheduledCell(meeting)
      case 'duration':
        return renderDurationCell(meeting)
      case 'team':
        return renderTeamCell(meeting)
      case 'initiative':
        return renderInitiativeCell(meeting)
      case 'participants':
        return renderParticipantsCell(meeting)
      case 'actions':
        return renderActionsCell(meeting, (e: React.MouseEvent) =>
          handleButtonClick(e, meetingId)
        )
      default:
        return <TableCell>—</TableCell>
    }
  }

  // Render the dynamic table
  return (
    <div className={dataTableStyles.tableWrapper}>
      <Table>
        <TableHeader>
          <TableRow>
            {finalColumns.map(column => (
              <TableHead
                key={column.type}
                className={`px-4 ${column.width ? `w-[${column.width}]` : ''}`}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayMeetings.map(meeting => {
            const isInstance = 'type' in meeting && meeting.type === 'instance'
            const meetingId = isInstance
              ? `${(meeting as MeetingInstanceWithRelations).meeting.id}-${meeting.id}`
              : meeting.id

            return (
              <TableRow
                key={isInstance ? `${meeting.type}-${meeting.id}` : meeting.id}
                className='hover:bg-accent/50 cursor-pointer'
                onClick={() => handleRowClick(meetingId, isInstance)}
                onContextMenu={e =>
                  enableRightClick && handleRowRightClick(e, meetingId)
                }
              >
                {finalColumns.map(column => (
                  <React.Fragment key={column.type}>
                    {renderColumnCell(column, meeting)}
                  </React.Fragment>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => (
          <>
            <ViewDetailsMenuItem
              entityId={entityId}
              entityType='meetings'
              close={close}
            />
            <EditMenuItem
              entityId={entityId}
              entityType='meetings'
              close={close}
            />
            <DeleteMenuItem
              onDelete={() => {
                setDeleteTargetId(entityId)
                setShowDeleteModal(true)
              }}
              close={close}
            />
          </>
        )}
      </ContextMenuComponent>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTargetId(null)
        }}
        onConfirm={() => {
          if (deleteTargetId) {
            return handleDelete(deleteTargetId)
          }
        }}
        title='Delete Meeting'
        entityName='meeting'
      />
    </div>
  )
}
