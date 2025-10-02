'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteNotification } from '@/lib/actions/notification'
import { toast } from 'sonner'
import { ActionDropdown } from '@/components/common/action-dropdown'

interface NotificationActionsDropdownProps {
  notificationId: string
  notificationTitle: string
  size?: 'sm' | 'default'
}

export function NotificationActionsDropdown({
  notificationId,
  notificationTitle,
  size = 'default',
}: NotificationActionsDropdownProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteNotification(notificationId)
      toast.success('Notification deleted successfully')
      window.location.reload()
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete notification',
      )
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <ActionDropdown
      size={size}
      menuClassName='w-48'
      onOpenChange={open => {
        if (!open) {
          setShowConfirm(false)
        }
      }}
    >
      {() => (
        <div className='py-1'>
          {showConfirm ? (
            <div className='px-3 py-2 space-y-2'>
              <div className='text-sm font-medium text-destructive mb-2'>
                Are you sure you want to delete this notification?
              </div>
              <div className='text-xs text-muted-foreground mb-2'>
                &ldquo;{notificationTitle}&rdquo;
              </div>
              <div className='flex gap-2'>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  variant='destructive'
                  size='sm'
                  className='flex-1'
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                  onClick={() => setShowConfirm(false)}
                  disabled={isDeleting}
                  variant='outline'
                  size='sm'
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
              onClick={() => setShowConfirm(true)}
            >
              <Trash2 className='w-4 h-4' />
              Delete Notification
            </button>
          )}
        </div>
      )}
    </ActionDropdown>
  )
}
