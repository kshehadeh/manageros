'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Target,
  Calendar,
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
import { deleteMeeting } from '@/lib/actions'
import { toast } from 'sonner'
import { DeleteModal } from '@/components/common/delete-modal'
import {
  Meeting,
  Team,
  Initiative,
  Person,
  User as PrismaUser,
} from '@prisma/client'

export type MeetingWithRelations = Meeting & {
  team: Team | null
  initiative: Initiative | null
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
  // Legacy props for backward compatibility
  variant?: 'full' | 'initiative' | 'dashboard'
  initiativeId?: string
  showCreateButton?: boolean
  onCreateMeeting?: () => void
  enableRowClick?: boolean
  enableDoubleClick?: boolean
  enableRightClick?: boolean
  rowClickHandler?: (_meetingId: string, _isInstance?: boolean) => void
  emptyStateMessage?: string
  emptyStateAction?: {
    label: string
    onClick: () => void
  }
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  meetingId: string
  triggerType: 'rightClick' | 'button'
}

// Utility functions
function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function formatDateTime(date: Date) {
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

  return (
    <TableCell className='font-medium text-foreground'>
      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <Calendar className='h-4 w-4 text-muted-foreground flex-shrink-0' />
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
          </button>
        </div>
        {showBadge && (
          <div className='flex items-center gap-3 text-xs text-muted-foreground ml-6'>
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
  variant,
  initiativeId: _initiativeId,
  showCreateButton: _showCreateButton,
  onCreateMeeting: _onCreateMeeting,
  enableRowClick = false,
  enableDoubleClick = false,
  enableRightClick = false,
  rowClickHandler,
  emptyStateMessage,
  emptyStateAction,
}: SharedMeetingsTableProps) {
  const [_isPending, startTransition] = useTransition()
  const router = useRouter()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    meetingId: '',
    triggerType: 'rightClick',
  })
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
    if (effectiveRowClickHandler) {
      effectiveRowClickHandler(meetingId, isInstance)
    }
  }

  const handleRowDoubleClick = (meetingId: string) => {
    if (enableDoubleClick) {
      router.push(`/meetings/${meetingId}`)
    }
  }

  const handleRowRightClick = (e: React.MouseEvent, meetingId: string) => {
    if (enableRightClick) {
      e.preventDefault()
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        meetingId,
        triggerType: 'rightClick',
      })
    }
  }

  const handleButtonClick = (e: React.MouseEvent, meetingId: string) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      visible: true,
      x: rect.right - 160,
      y: rect.bottom + 4,
      meetingId,
      triggerType: 'button',
    })
  }

  // Convert variant to column configuration for backward compatibility
  const getColumnsFromVariant = (variant?: string): MeetingColumnConfig[] => {
    if (columns) return columns

    switch (variant) {
      case 'dashboard':
        return [
          { type: 'title', header: 'Title' },
          { type: 'dateTime', header: 'Date/Time' },
          { type: 'duration', header: 'Duration' },
        ]
      case 'initiative':
        return [
          { type: 'title', header: 'Title' },
          { type: 'time', header: 'Date & Time' },
          { type: 'team', header: 'Team' },
          { type: 'actions', header: '', width: '50px' },
        ]
      case 'full':
      default:
        return [
          { type: 'title', header: 'Title' },
          { type: 'scheduled', header: 'Scheduled' },
          { type: 'duration', header: 'Duration' },
          { type: 'team', header: 'Team' },
          { type: 'initiative', header: 'Initiative' },
          { type: 'actions', header: 'Actions', width: '50px' },
        ]
    }
  }

  const finalColumns = getColumnsFromVariant(variant)

  // Set interaction behavior based on variant
  const handleVariantBehavior = (variant?: string) => {
    switch (variant) {
      case 'dashboard':
        return {
          enableRowClick: true,
          enableDoubleClick: false,
          enableRightClick: false,
          rowClickHandler: (meetingId: string, isInstance?: boolean) => {
            const href = isInstance
              ? `/meetings/${meetingId.split('-')[0]}/instances/${meetingId.split('-')[1]}`
              : `/meetings/${meetingId}`
            window.location.href = href
          },
        }
      case 'initiative':
        return {
          enableRowClick: true,
          enableDoubleClick: false,
          enableRightClick: false,
          rowClickHandler: (meetingId: string) => {
            startTransition(() => {
              router.push(`/meetings/${meetingId}`)
            })
          },
        }
      case 'full':
      default:
        return {
          enableRowClick: enableRowClick,
          enableDoubleClick: enableDoubleClick || true,
          enableRightClick: enableRightClick || true,
          rowClickHandler: rowClickHandler,
        }
    }
  }

  const behaviorConfig = handleVariantBehavior(variant)
  const finalEnableRowClick = behaviorConfig.enableRowClick || enableRowClick
  const finalEnableDoubleClick =
    behaviorConfig.enableDoubleClick || enableDoubleClick
  const finalEnableRightClick =
    behaviorConfig.enableRightClick || enableRightClick

  // Override rowClickHandler if variant provides one
  const effectiveRowClickHandler =
    behaviorConfig.rowClickHandler || rowClickHandler

  // Determine which meetings to display
  const displayMeetings = filteredMeetings || meetings

  // Handle empty state
  if (displayMeetings.length === 0) {
    return (
      <div className='text-center py-8'>
        <Calendar className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
        <p className='text-muted-foreground text-sm mb-4'>
          {emptyStateMessage || 'No meetings scheduled.'}
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
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            {finalColumns.map(column => (
              <TableHead
                key={column.type}
                className={column.width ? `w-[${column.width}]` : undefined}
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
                className={`hover:bg-accent/50 ${finalEnableRowClick ? 'cursor-pointer' : ''}`}
                onClick={() =>
                  finalEnableRowClick && handleRowClick(meetingId, isInstance)
                }
                onDoubleClick={() =>
                  finalEnableDoubleClick && handleRowDoubleClick(meetingId)
                }
                onContextMenu={e =>
                  finalEnableRightClick && handleRowRightClick(e, meetingId)
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
      {contextMenu.visible && (
        <>
          {/* Backdrop to close menu */}
          <div
            className='fixed inset-0 z-40'
            onClick={() =>
              setContextMenu(prev => ({ ...prev, visible: false }))
            }
          />

          {/* Context Menu */}
          <div
            className='fixed z-50 bg-popover text-popover-foreground border rounded-md shadow-lg py-1 min-w-[160px]'
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
              onClick={() => {
                router.push(`/meetings/${contextMenu.meetingId}`)
                setContextMenu(prev => ({ ...prev, visible: false }))
              }}
            >
              <Eye className='w-4 h-4' />
              View
            </button>
            <button
              className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
              onClick={() => {
                router.push(`/meetings/${contextMenu.meetingId}/edit`)
                setContextMenu(prev => ({ ...prev, visible: false }))
              }}
            >
              <Edit className='w-4 h-4' />
              Edit
            </button>
            <button
              className='w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center gap-2'
              onClick={event => {
                event.stopPropagation()
                setContextMenu(prev => ({ ...prev, visible: false }))
                setDeleteTargetId(contextMenu.meetingId)
                setShowDeleteModal(true)
              }}
            >
              <Trash2 className='w-4 h-4' />
              Delete
            </button>
          </div>
        </>
      )}

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
