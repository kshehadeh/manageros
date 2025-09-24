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
  User,
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
import {
  Meeting,
  Team,
  Initiative,
  Person,
  User as PrismaUser,
} from '@prisma/client'

type MeetingWithRelations = Meeting & {
  team: Team | null
  initiative: Initiative | null
  owner: Person | null
  createdBy: PrismaUser | null
  participants: Array<{
    person: Person
    status: string
  }>
}

interface MeetingsTableProps {
  meetings: MeetingWithRelations[]
  filteredMeetings?: MeetingWithRelations[]
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  meetingId: string
  triggerType: 'rightClick' | 'button'
}

export function MeetingsTable({
  meetings,
  filteredMeetings,
}: MeetingsTableProps) {
  const displayMeetings = filteredMeetings || meetings
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

  const handleRowDoubleClick = (meetingId: string) => {
    router.push(`/meetings/${meetingId}`)
  }

  const handleRowRightClick = (e: React.MouseEvent, meetingId: string) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      meetingId,
      triggerType: 'rightClick',
    })
  }

  const handleButtonClick = (e: React.MouseEvent, meetingId: string) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      visible: true,
      x: rect.right - 160, // Position menu to the left of the button
      y: rect.bottom + 4, // Position menu below the button
      meetingId,
      triggerType: 'button',
    })
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getStatusBadge = (meeting: MeetingWithRelations) => {
    const now = new Date()
    const scheduledAt = new Date(meeting.scheduledAt)

    if (scheduledAt < now) {
      return <Badge variant='secondary'>Past</Badge>
    } else if (scheduledAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return <Badge variant='default'>Today</Badge>
    } else {
      return <Badge variant='outline'>Upcoming</Badge>
    }
  }

  if (displayMeetings.length === 0) {
    return (
      <div className='text-muted-foreground text-sm text-center py-8'>
        {filteredMeetings
          ? 'No meetings match your filters.'
          : 'No meetings yet.'}
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-accent/50'>
            <TableHead className='text-muted-foreground'>Title</TableHead>
            <TableHead className='text-muted-foreground'>Scheduled</TableHead>
            <TableHead className='text-muted-foreground'>Duration</TableHead>
            <TableHead className='text-muted-foreground'>Status</TableHead>
            <TableHead className='text-muted-foreground'>Team</TableHead>
            <TableHead className='text-muted-foreground'>Initiative</TableHead>
            <TableHead className='text-muted-foreground'>Owner</TableHead>
            <TableHead className='text-muted-foreground'>
              Participants
            </TableHead>
            <TableHead className='text-muted-foreground w-[50px]'>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayMeetings.map(meeting => (
            <TableRow
              key={meeting.id}
              className='hover:bg-accent/50 cursor-pointer'
              onDoubleClick={() => handleRowDoubleClick(meeting.id)}
              onContextMenu={e => handleRowRightClick(e, meeting.id)}
            >
              <TableCell className='font-medium text-foreground'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
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
                {getStatusBadge(meeting)}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {meeting.team ? (
                  <div className='flex items-center gap-1'>
                    <Building2 className='h-3 w-3' />
                    {meeting.team.name}
                  </div>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {meeting.initiative ? (
                  <div className='flex items-center gap-1'>
                    <Target className='h-3 w-3' />
                    {meeting.initiative.title}
                  </div>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {meeting.owner ? (
                  <div className='flex items-center gap-1'>
                    <User className='h-3 w-3' />
                    {meeting.owner.name}
                  </div>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary'>
                  {meeting.participants.length}
                </span>
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

          {/* View Initiative - only show if meeting has an initiative */}
          {(() => {
            const meeting = displayMeetings.find(
              m => m.id === contextMenu.meetingId
            )
            if (!meeting?.initiative) return null

            return (
              <button
                className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
                onClick={() => {
                  router.push(`/initiatives/${meeting.initiative!.id}`)
                  setContextMenu(prev => ({ ...prev, visible: false }))
                }}
              >
                <Target className='w-4 h-4' />
                View Initiative
              </button>
            )
          })()}

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
