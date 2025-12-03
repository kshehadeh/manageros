'use client'

import { useRouter } from 'next/navigation'
import { Link } from '@/components/ui/link'
import { Edit, Trash2, CalendarPlus } from 'lucide-react'
import { deleteMeetingInstance } from '@/lib/actions/meeting-instance'
import { toast } from 'sonner'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { ConfirmAction } from '@/components/common/confirm-action'

interface MeetingInstanceActionsDropdownProps {
  meetingId: string
  instanceId: string
  size?: 'sm' | 'default'
  canEdit?: boolean
  canDelete?: boolean
}

export function MeetingInstanceActionsDropdown({
  meetingId,
  instanceId,
  size = 'sm',
  canEdit = false,
  canDelete = false,
}: MeetingInstanceActionsDropdownProps) {
  const router = useRouter()
  const handleDelete = async () => {
    try {
      await deleteMeetingInstance(instanceId)
      toast.success('Meeting instance deleted successfully')
      router.push(`/meetings/${meetingId}`)
    } catch (error) {
      console.error('Error deleting meeting instance:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete meeting instance'
      )
    }
  }

  // Don't show dropdown if user has no permissions
  if (!canEdit && !canDelete) {
    return null
  }

  return (
    <ActionDropdown size={size}>
      {({ close }) => (
        <div className='py-1'>
          {canEdit && (
            <>
              <Link
                href={`/meetings/${meetingId}/instances/${instanceId}/edit`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={close}
              >
                <Edit className='w-4 h-4' />
                Edit Instance
              </Link>

              <Link
                href={`/meetings/${meetingId}/instances/new`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={close}
              >
                <CalendarPlus className='w-4 h-4' />
                Create Instance
              </Link>
            </>
          )}

          {canDelete && (
            <>
              {canEdit && <div className='border-t border-border my-1' />}

              <ConfirmAction
                onConfirm={handleDelete}
                renderTrigger={({ open }) => (
                  <button
                    className='flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-left'
                    onClick={open}
                  >
                    <Trash2 className='w-4 h-4' />
                    Delete Instance
                  </button>
                )}
                confirmMessage='Are you sure you want to delete this meeting instance?'
                confirmDescription='This action cannot be undone.'
              />
            </>
          )}
        </div>
      )}
    </ActionDropdown>
  )
}
