'use client'

import { useState, useTransition, useEffect } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteMeeting } from '@/lib/actions'
import { toast } from 'sonner'
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

export type MeetingsTableVariant = 'full' | 'initiative' | 'dashboard'

export interface SharedMeetingsTableProps {
  meetings: (MeetingWithRelations | UpcomingMeeting)[]
  filteredMeetings?: MeetingWithRelations[]
  variant?: MeetingsTableVariant
  initiativeId?: string
  showCreateButton?: boolean
  onCreateMeeting?: () => void
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

export function SharedMeetingsTable({
  meetings,
  filteredMeetings,
  variant = 'full',
  initiativeId: _initiativeId,
  showCreateButton = false,
  onCreateMeeting,
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

  // Handle clicking outside context menu to close it
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(prev => ({ ...prev, visible: false }))
    }

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.visible])

  const handleDelete = async (meetingId: string) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      startTransition(async () => {
        try {
          await deleteMeeting(meetingId)
          toast.success('Meeting deleted successfully')
        } catch (error) {
          console.error('Failed to delete meeting:', error)
          toast.error(
            error instanceof Error ? error.message : 'Failed to delete meeting'
          )
        }
      })
    }
  }

  const handleRowClick = (meetingId: string, isInstance = false) => {
    if (variant === 'initiative') {
      startTransition(() => {
        router.push(`/meetings/${meetingId}`)
      })
    } else if (variant === 'dashboard') {
      const href = isInstance
        ? `/meetings/${meetingId.split('-')[0]}/instances/${meetingId.split('-')[1]}`
        : `/meetings/${meetingId}`
      window.location.href = href
    }
  }

  const handleRowDoubleClick = (meetingId: string) => {
    if (variant === 'full') {
      router.push(`/meetings/${meetingId}`)
    }
  }

  const handleRowRightClick = (e: React.MouseEvent, meetingId: string) => {
    if (variant === 'full') {
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
    if (variant === 'full') {
      const rect = e.currentTarget.getBoundingClientRect()
      setContextMenu({
        visible: true,
        x: rect.right - 160,
        y: rect.bottom + 4,
        meetingId,
        triggerType: 'button',
      })
    }
  }

  // Determine which meetings to display
  const displayMeetings = filteredMeetings || meetings

  // Handle empty state
  if (displayMeetings.length === 0) {
    if (variant === 'initiative') {
      return (
        <div className='page-section'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold'>Meetings</h2>
            {showCreateButton && onCreateMeeting && (
              <Button onClick={onCreateMeeting} size='sm'>
                <Plus className='h-4 w-4 mr-2' />
                Add Meeting
              </Button>
            )}
          </div>
          <div className='text-center py-8'>
            <Calendar className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
            <p className='text-muted-foreground mb-4'>
              {emptyStateMessage || 'No meetings scheduled for this initiative'}
            </p>
            {emptyStateAction && (
              <Button onClick={emptyStateAction.onClick} variant='outline'>
                <Plus className='h-4 w-4 mr-2' />
                {emptyStateAction.label}
              </Button>
            )}
          </div>
        </div>
      )
    }

    if (variant === 'dashboard') {
      return (
        <div className='text-center py-8'>
          <p className='text-muted-foreground text-sm'>
            {emptyStateMessage || 'No upcoming meetings'}
          </p>
        </div>
      )
    }

    return (
      <div className='text-muted-foreground text-sm text-center py-8'>
        {emptyStateMessage || 'No meetings yet.'}
      </div>
    )
  }

  // Render table based on variant
  if (variant === 'dashboard') {
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
            {(displayMeetings as UpcomingMeeting[]).map(meeting => {
              const isInstance = meeting.type === 'instance'
              const meetingData = isInstance ? meeting.meeting : meeting
              const meetingId = isInstance
                ? `${meeting.meeting.id}-${meeting.id}`
                : meeting.id

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
                  onClick={() => handleRowClick(meetingId, isInstance)}
                >
                  <TableCell className='p-2'>
                    <div>
                      <div className='font-medium text-sm'>
                        {meetingData.title}
                      </div>
                      <div className='flex items-center gap-2 text-xs text-muted-foreground mt-1'>
                        <div className='flex items-center gap-1'>
                          <Users className='h-3 w-3 flex-shrink-0' />
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
                      <Calendar className='h-3 w-3 text-muted-foreground flex-shrink-0' />
                      <span className='font-semibold'>
                        {formatDateTime(meeting.scheduledAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='p-2'>
                    {meetingData.duration ? (
                      <div className='flex items-center gap-1 text-sm'>
                        <Clock className='h-3 w-3 text-muted-foreground flex-shrink-0' />
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

  if (variant === 'initiative') {
    return (
      <div className='page-section'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>
            Meetings ({(displayMeetings as MeetingWithRelations[]).length})
          </h2>
          {showCreateButton && onCreateMeeting && (
            <Button onClick={onCreateMeeting} size='sm'>
              <Plus className='h-4 w-4 mr-2' />
              Add Meeting
            </Button>
          )}
        </div>

        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className='w-[50px]'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(displayMeetings as MeetingWithRelations[]).map(meeting => (
                <TableRow
                  key={meeting.id}
                  className='hover:bg-accent/50 cursor-pointer'
                  onClick={() => handleRowClick(meeting.id)}
                >
                  <TableCell className='font-medium text-foreground'>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                        {meeting.title}
                      </div>
                      <div className='flex items-center gap-3 text-xs text-muted-foreground ml-6'>
                        {getStatusBadge(meeting)}
                        <div className='flex items-center gap-1'>
                          <Clock className='h-3 w-3 flex-shrink-0' />
                          {formatDuration(meeting.duration)}
                        </div>
                        <div className='flex items-center gap-1'>
                          <Users className='h-3 w-3 flex-shrink-0' />
                          {meeting.participants.length} participant
                          {meeting.participants.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    <div className='space-y-1'>
                      <div className='font-medium'>
                        {formatDate(meeting.scheduledAt)}
                      </div>
                      <div className='text-sm'>
                        {formatTime(meeting.scheduledAt)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {meeting.team ? (
                      <div className='flex items-center gap-1'>
                        <Building2 className='h-3 w-3 flex-shrink-0' />
                        {meeting.team.name}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0'
                          onClick={e => e.stopPropagation()}
                        >
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            handleRowClick(meeting.id)
                          }}
                        >
                          <Eye className='h-4 w-4 mr-2' />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            router.push(`/meetings/${meeting.id}/edit`)
                          }}
                        >
                          <Edit className='h-4 w-4 mr-2' />
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Full variant (default)
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-accent/50'>
            <TableHead className='text-muted-foreground'>Title</TableHead>
            <TableHead className='text-muted-foreground'>Scheduled</TableHead>
            <TableHead className='text-muted-foreground'>Duration</TableHead>
            <TableHead className='text-muted-foreground'>Team</TableHead>
            <TableHead className='text-muted-foreground'>Initiative</TableHead>
            <TableHead className='text-muted-foreground w-[50px]'>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(displayMeetings as MeetingWithRelations[]).map(meeting => (
            <TableRow
              key={meeting.id}
              className='hover:bg-accent/50 cursor-pointer'
              onDoubleClick={() => handleRowDoubleClick(meeting.id)}
              onContextMenu={e => handleRowRightClick(e, meeting.id)}
            >
              <TableCell className='font-medium text-foreground'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                  {meeting.title}
                </div>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {formatDate(meeting.scheduledAt)}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {formatDuration(meeting.duration || 0)}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {meeting.team ? (
                  <div className='flex items-center gap-1'>
                    <Building2 className='h-3 w-3 flex-shrink-0' />
                    {meeting.team.name}
                  </div>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {meeting.initiative ? (
                  <div className='flex items-center gap-1'>
                    <Target className='h-3 w-3 flex-shrink-0' />
                    {meeting.initiative.title}
                  </div>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant='ghost'
                  className='h-8 w-8 p-0'
                  onClick={e => handleButtonClick(e, meeting.id)}
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Context Menu */}
      {contextMenu.visible && (
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
            className='w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-2'
            onClick={() => {
              handleDelete(contextMenu.meetingId)
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Trash2 className='w-4 h-4' />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
