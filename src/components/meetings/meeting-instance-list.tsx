'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from '@/components/ui/section-header'
import { deleteMeetingInstance } from '@/lib/actions/meeting-instance'
import { toast } from 'sonner'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import { DeleteMenuItem } from '@/components/common/context-menu-items'
import { DeleteModal } from '@/components/common/delete-modal'
import { MoreHorizontal, Calendar, Plus, Edit } from 'lucide-react'
import { MeetingInstance, Person } from '@prisma/client'

type MeetingInstanceWithRelations = MeetingInstance & {
  participants: {
    id: string
    personId: string
    status: string
    createdAt: Date
    updatedAt: Date
    meetingInstanceId: string
    person: Person
  }[]
}

interface MeetingInstanceListProps {
  instances: MeetingInstanceWithRelations[]
  meetingId: string
  parentParticipants?: Array<{
    personId: string
    status: string
  }>
  parentScheduledAt?: Date
  canEdit?: boolean
}

export function MeetingInstanceList({
  instances,
  meetingId,
  parentParticipants: _parentParticipants = [],
  parentScheduledAt: _parentScheduledAt,
  canEdit = false,
}: MeetingInstanceListProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()

  const handleDeleteInstance = async () => {
    if (!deleteTargetId) return

    try {
      await deleteMeetingInstance(deleteTargetId)
      toast.success('Meeting instance deleted successfully')
      setShowDeleteModal(false)
      setDeleteTargetId(null)
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error deleting meeting instance:', error)
      toast.error('Failed to delete meeting instance')
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

  const renderInstanceItem = (instance: MeetingInstanceWithRelations) => {
    const scheduledDate = new Date(instance.scheduledAt)
    const now = new Date()
    const isUpcoming = scheduledDate > now
    const isPast = scheduledDate < now

    return (
      <div
        key={instance.id}
        className='flex items-center justify-between px-3 py-3 hover:bg-muted/50 transition-colors'
      >
        <Link
          href={`/meetings/${meetingId}/instances/${instance.id}`}
          className='flex items-start gap-3 flex-1 min-w-0'
        >
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 text-xs text-muted-foreground mb-1'>
              <Calendar className='h-4 w-4' />
              <span>
                {format(scheduledDate, 'MMM d, yyyy')} at{' '}
                {format(scheduledDate, 'h:mm a')}
              </span>
            </div>

            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Badge
                variant={
                  isUpcoming ? 'default' : isPast ? 'secondary' : 'outline'
                }
                className='text-xs'
              >
                {isUpcoming ? 'Upcoming' : isPast ? 'Past' : 'Today'}
              </Badge>
              <span>•</span>
              <span>{getAttendanceSummary(instance)}</span>
            </div>
          </div>
        </Link>

        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0 hover:bg-muted shrink-0'
          onClick={e => handleButtonClick(e, instance.id)}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <SectionHeader
        icon={Calendar}
        title='Meeting Instances'
        action={
          canEdit ? (
            <Button asChild className='flex items-center gap-2'>
              <Link href={`/meetings/${meetingId}/instances/new`}>
                <Plus className='h-4 w-4' />
                Add Instance
              </Link>
            </Button>
          ) : undefined
        }
      />

      {instances.length === 0 ? (
        <div className='text-center py-8'>
          <Calendar className='h-8 w-8 text-muted-foreground mx-auto mb-2' />
          <p className='text-sm text-muted-foreground mb-4'>
            No meeting instances yet
          </p>
          {canEdit && (
            <Button asChild className='flex items-center gap-2'>
              <Link href={`/meetings/${meetingId}/instances/new`}>
                <Plus className='h-4 w-4' />
                Create First Instance
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <section className='rounded-xl py-4 -mx-3 px-3 space-y-4'>
          <div className='space-y-3'>{instances.map(renderInstanceItem)}</div>
        </section>
      )}

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
            {canEdit && (
              <button
                className='w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2'
                onClick={() => {
                  router.push(
                    `/meetings/${meetingId}/instances/${entityId}/edit`
                  )
                  close()
                }}
              >
                <Edit className='w-4 h-4' />
                Edit
              </button>
            )}
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
        onConfirm={handleDeleteInstance}
        title='Delete Meeting Instance'
        entityName='meeting instance'
      />
    </div>
  )
}
