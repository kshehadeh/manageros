'use client'

import { Trash2 } from 'lucide-react'
import { deleteNotification } from '@/lib/actions/notification'
import { toast } from 'sonner'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { ConfirmAction } from '@/components/common/confirm-action'

interface NotificationActionsDropdownProps {
  notificationId: string
  notificationTitle: string
  size?: 'sm' | 'default'
}

export function NotificationActionsDropdown({
  notificationId,
  notificationTitle,
  size = 'sm',
}: NotificationActionsDropdownProps) {
  const handleDelete = async () => {
    try {
      await deleteNotification(notificationId)
      toast.success('Notification deleted successfully')
      window.location.reload()
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete notification'
      )
    }
  }

  return (
    <ActionDropdown size={size} menuClassName='w-48'>
      {() => (
        <div className='py-1'>
          <ConfirmAction
            onConfirm={handleDelete}
            renderTrigger={({ open }) => (
              <button
                className='flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-left'
                onClick={open}
              >
                <Trash2 className='w-4 h-4' />
                Delete Notification
              </button>
            )}
            confirmMessage='Are you sure you want to delete this notification?'
            confirmDescription={
              notificationTitle
                ? `"${notificationTitle}"`
                : 'This action cannot be undone.'
            }
          />
        </div>
      )}
    </ActionDropdown>
  )
}
