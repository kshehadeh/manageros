'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit, Eye, Trash2, Calendar } from 'lucide-react'
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
import { deleteMeetingInstance } from '@/lib/actions/meeting-instance'
import { toast } from 'sonner'
import {
  MeetingInstance,
  Person,
  MeetingInstanceParticipant,
} from '@prisma/client'

type MeetingInstanceWithRelations = MeetingInstance & {
  participants: (MeetingInstanceParticipant & {
    person: Person
  })[]
}

interface MeetingInstanceTableProps {
  instances: MeetingInstanceWithRelations[]
  meetingId: string
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  instanceId: string
  triggerType: 'rightClick' | 'button'
}

export function MeetingInstanceTable({
  instances,
  meetingId,
}: MeetingInstanceTableProps) {
  const [_isPending, startTransition] = useTransition()
  const router = useRouter()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    instanceId: '',
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

  const handleDelete = async (instanceId: string) => {
    if (confirm('Are you sure you want to delete this meeting instance?')) {
      startTransition(async () => {
        try {
          await deleteMeetingInstance(instanceId)
          toast.success('Meeting instance deleted successfully')
        } catch (error) {
          console.error('Failed to delete meeting instance:', error)
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to delete meeting instance'
          )
        }
      })
    }
  }

  const handleRowDoubleClick = (instanceId: string) => {
    router.push(`/meetings/${meetingId}/instances/${instanceId}`)
  }

  const handleRowRightClick = (e: React.MouseEvent, instanceId: string) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      instanceId,
      triggerType: 'rightClick',
    })
  }

  const handleButtonClick = (e: React.MouseEvent, instanceId: string) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      visible: true,
      x: rect.right - 160, // Position menu to the left of the button
      y: rect.bottom + 4, // Position menu below the button
      instanceId,
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

  const getStatusBadge = (instance: MeetingInstanceWithRelations) => {
    const now = new Date()
    const scheduledAt = new Date(instance.scheduledAt)

    if (scheduledAt < now) {
      return <Badge variant='secondary'>Past</Badge>
    } else if (scheduledAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return <Badge variant='default'>Today</Badge>
    } else {
      return <Badge variant='outline'>Upcoming</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended':
        return 'bg-green-100 text-green-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'accepted':
        return 'bg-blue-100 text-blue-800'
      case 'declined':
        return 'bg-gray-100 text-gray-800'
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAttendanceSummary = (instance: MeetingInstanceWithRelations) => {
    const attendedCount = instance.participants.filter(
      p => p.status === 'attended'
    ).length
    const totalParticipants = instance.participants.length

    if (totalParticipants === 0) {
      return 'No participants'
    }

    return `${attendedCount}/${totalParticipants} attended`
  }

  if (instances.length === 0) {
    return (
      <div className='text-muted-foreground text-sm text-center py-8'>
        No meeting instances yet.
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-accent/50'>
            <TableHead className='text-muted-foreground'>Scheduled</TableHead>
            <TableHead className='text-muted-foreground'>Status</TableHead>
            <TableHead className='text-muted-foreground'>Attendance</TableHead>
            <TableHead className='text-muted-foreground w-[50px]'>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instances.map(instance => (
            <TableRow
              key={instance.id}
              className='hover:bg-accent/50 cursor-pointer'
              onDoubleClick={() => handleRowDoubleClick(instance.id)}
              onContextMenu={e => handleRowRightClick(e, instance.id)}
            >
              <TableCell className='font-medium text-foreground'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                  {formatDate(instance.scheduledAt)}
                </div>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {getStatusBadge(instance)}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                <div className='space-y-1'>
                  <div className='text-sm font-medium'>
                    {getAttendanceSummary(instance)}
                  </div>
                  {instance.participants.length > 0 && (
                    <div className='flex flex-wrap gap-1'>
                      {instance.participants.slice(0, 3).map(participant => (
                        <Badge
                          key={participant.id}
                          className={`text-xs ${getStatusColor(participant.status)}`}
                        >
                          {participant.person.name}
                        </Badge>
                      ))}
                      {instance.participants.length > 3 && (
                        <Badge variant='outline' className='text-xs'>
                          +{instance.participants.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant='ghost'
                  className='h-8 w-8 p-0'
                  onClick={e => handleButtonClick(e, instance.id)}
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
              router.push(
                `/meetings/${meetingId}/instances/${contextMenu.instanceId}`
              )
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Eye className='w-4 h-4' />
            View
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
            onClick={() => {
              router.push(
                `/meetings/${meetingId}/instances/${contextMenu.instanceId}/edit`
              )
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Edit className='w-4 h-4' />
            Edit
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-2'
            onClick={() => {
              handleDelete(contextMenu.instanceId)
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
