'use client'

import {
  MoreVertical,
  Eye,
  CheckCircle2,
  CheckCircle,
  Trash2,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  markNotificationAsRead,
  acknowledgeNotification,
  ignoreNotification,
  resolveNotification,
  deleteNotification,
} from '@/lib/actions/notification'
import { NotificationWithResponse } from '@/lib/actions/notification'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { ConfirmAction } from '@/components/common/confirm-action'
import { toast } from 'sonner'

interface NotificationStatusDropdownProps {
  notification: NotificationWithResponse
  onActionComplete?: () => void
  size?: 'sm' | 'default'
  align?: 'left' | 'right'
}

export function NotificationStatusDropdown({
  notification,
  onActionComplete,
  size = 'sm',
  align = 'right',
}: NotificationStatusDropdownProps) {
  const handleMarkAsRead = async () => {
    try {
      await markNotificationAsRead(notification.id)
      onActionComplete?.()
      toast.success('Notification marked as read')
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const handleAcknowledge = async () => {
    try {
      await acknowledgeNotification(notification.id)
      onActionComplete?.()
      toast.success('Notification acknowledged')
    } catch (error) {
      console.error('Failed to acknowledge notification:', error)
      toast.error('Failed to acknowledge notification')
    }
  }

  const handleIgnore = async () => {
    try {
      await ignoreNotification(notification.id)
      onActionComplete?.()
      toast.success('Notification ignored')
    } catch (error) {
      console.error('Failed to ignore notification:', error)
      toast.error('Failed to ignore notification')
    }
  }

  const handleResolve = async () => {
    try {
      await resolveNotification(notification.id)
      onActionComplete?.()
      toast.success('Notification resolved')
    } catch (error) {
      console.error('Failed to resolve notification:', error)
      toast.error('Failed to resolve notification')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteNotification(notification.id)
      onActionComplete?.()
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Failed to delete notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const status = notification.response?.status
  const isRead = status === 'read'
  const isAcknowledged = status === 'acknowledged'
  const isIgnored = status === 'ignored'
  const isResolved = status === 'resolved'

  return (
    <div onClick={e => e.stopPropagation()}>
      <ActionDropdown
        size={size}
        align={align}
        menuClassName='w-48'
        usePortal={true}
        trigger={({ toggle }) => (
          <Button
            variant='ghost'
            size={size}
            onClick={e => {
              e.stopPropagation()
              e.preventDefault()
              toggle(e)
            }}
            className={size === 'sm' ? 'h-6 px-2 text-xs' : ''}
          >
            <MoreVertical className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
          </Button>
        )}
      >
        {({ close }) => (
          <div className='py-1'>
            <button
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors text-left ${
                isRead ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'
              }`}
              onClick={e => {
                e.stopPropagation()
                if (!isRead) {
                  handleMarkAsRead()
                  close()
                }
              }}
              disabled={isRead}
            >
              <Eye className='h-3 w-3' />
              Mark as read
            </button>
            <button
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors text-left ${
                isAcknowledged
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-muted'
              }`}
              onClick={e => {
                e.stopPropagation()
                if (!isAcknowledged) {
                  handleAcknowledge()
                  close()
                }
              }}
              disabled={isAcknowledged}
            >
              <CheckCircle2 className='h-3 w-3' />
              Acknowledge
            </button>
            <button
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors text-left ${
                isIgnored ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'
              }`}
              onClick={e => {
                e.stopPropagation()
                if (!isIgnored) {
                  handleIgnore()
                  close()
                }
              }}
              disabled={isIgnored}
            >
              <Ban className='h-3 w-3' />
              Ignore
            </button>
            <button
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors text-left ${
                isResolved ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'
              }`}
              onClick={e => {
                e.stopPropagation()
                if (!isResolved) {
                  handleResolve()
                  close()
                }
              }}
              disabled={isResolved}
            >
              <CheckCircle className='h-3 w-3' />
              Resolve
            </button>
            <Separator className='my-1' />
            <ConfirmAction
              onConfirm={() => {
                handleDelete()
                close()
              }}
              renderTrigger={({ open }) => (
                <button
                  className='flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-left'
                  onClick={e => {
                    e.stopPropagation()
                    open()
                  }}
                >
                  <Trash2 className='h-3 w-3' />
                  Delete
                </button>
              )}
              confirmMessage='Are you sure you want to delete this notification?'
              confirmDescription={
                notification.title
                  ? `"${notification.title}"`
                  : 'This action cannot be undone.'
              }
            />
          </div>
        )}
      </ActionDropdown>
    </div>
  )
}
