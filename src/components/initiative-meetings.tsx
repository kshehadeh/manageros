'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  Users,
  Building2,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
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

interface InitiativeMeetingsProps {
  meetings: MeetingWithRelations[]
  initiativeId: string
}

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

export function InitiativeMeetings({
  meetings,
  initiativeId,
}: InitiativeMeetingsProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const handleRowClick = (meetingId: string) => {
    startTransition(() => {
      router.push(`/meetings/${meetingId}`)
    })
  }

  const handleCreateMeeting = () => {
    startTransition(() => {
      router.push(`/meetings/new?initiativeId=${initiativeId}`)
    })
  }

  if (meetings.length === 0) {
    return (
      <div className='page-section'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>Meetings</h2>
          <Button onClick={handleCreateMeeting} size='sm'>
            <Plus className='h-4 w-4 mr-2' />
            Add Meeting
          </Button>
        </div>
        <div className='text-center py-8'>
          <Calendar className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
          <p className='text-muted-foreground mb-4'>
            No meetings scheduled for this initiative
          </p>
          <Button onClick={handleCreateMeeting} variant='outline'>
            <Plus className='h-4 w-4 mr-2' />
            Schedule First Meeting
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='page-section'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-semibold'>Meetings ({meetings.length})</h2>
        <Button onClick={handleCreateMeeting} size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          Add Meeting
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className='w-[50px]'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map(meeting => (
              <TableRow
                key={meeting.id}
                className='hover:bg-accent/50 cursor-pointer'
                onClick={() => handleRowClick(meeting.id)}
              >
                <TableCell className='font-medium text-foreground'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                    {meeting.title}
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
                  <div className='flex items-center gap-1'>
                    <Clock className='h-3 w-3' />
                    {formatDuration(meeting.duration)}
                  </div>
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {getStatusBadge(meeting)}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    <Users className='h-3 w-3' />
                    {meeting.participants.length}
                  </div>
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
