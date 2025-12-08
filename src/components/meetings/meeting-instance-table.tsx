'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Calendar } from 'lucide-react'
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
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import { DeleteMenuItem } from '@/components/common/context-menu-items'
import { DeleteModal } from '@/components/common/delete-modal'
import {
  MeetingInstance,
  Person,
  MeetingInstanceParticipant,
} from '@/generated/prisma'

type MeetingInstanceWithRelations = MeetingInstance & {
  participants: (MeetingInstanceParticipant & {
    person: Person
  })[]
}

interface MeetingInstanceTableProps {
  instances: MeetingInstanceWithRelations[]
  meetingId: string
}

export function MeetingInstanceTable({
  instances,
  meetingId,
}: MeetingInstanceTableProps) {
  const [, startTransition] = useTransition()
  const router = useRouter()
  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const handleDelete = async (instanceId: string) => {
    await deleteMeetingInstance(instanceId)
    toast.success('Meeting instance deleted successfully')
    startTransition(() => {
      router.refresh()
    })
  }

  const handleRowDoubleClick = (instanceId: string) => {
    router.push(`/meetings/${meetingId}/instances/${instanceId}`)
  }

  const handleRowRightClick = (e: React.MouseEvent, instanceId: string) => {
    e.preventDefault()
    handleButtonClick(e as React.MouseEvent, instanceId)
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return '—'

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(dateObj)
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
    <div className='-mx-3 md:mx-0 md:rounded-md border-y md:border overflow-hidden'>
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
      <ContextMenuComponent>
        {({ entityId, close }) => (
          <>
            <button
              className='w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2'
              onClick={() => {
                router.push(`/meetings/${meetingId}/instances/${entityId}`)
                close()
              }}
            >
              <Calendar className='w-4 h-4' />
              View Details
            </button>
            <button
              className='w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2'
              onClick={() => {
                router.push(`/meetings/${meetingId}/instances/${entityId}/edit`)
                close()
              }}
            >
              <MoreHorizontal className='w-4 h-4' />
              Edit
            </button>
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
        title='Delete Meeting Instance'
        entityName='meeting instance'
      />
    </div>
  )
}
