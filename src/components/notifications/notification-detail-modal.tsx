'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Eye,
  CheckCircle2,
  Ban,
  Trash2,
} from 'lucide-react'
import { NotificationWithResponse } from '@/lib/actions/notification'
import {
  markNotificationAsRead,
  acknowledgeNotification,
  ignoreNotification,
  resolveNotification,
  deleteNotification,
} from '@/lib/actions/notification'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ConfirmAction } from '@/components/common/confirm-action'

interface NotificationDetailModalProps {
  notification: NotificationWithResponse | null
  isOpen: boolean
  onClose: () => void
  onActionComplete?: () => void
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className='h-5 w-5 text-green-500' />
    case 'warning':
      return <AlertTriangle className='h-5 w-5 text-yellow-500' />
    case 'error':
      return <XCircle className='h-5 w-5 text-red-500' />
    default:
      return <Info className='h-5 w-5 text-blue-500' />
  }
}

const getStatusBadge = (response: NotificationWithResponse['response']) => {
  if (!response) {
    return <Badge variant='secondary'>Unread</Badge>
  }

  switch (response.status) {
    case 'read':
      return <Badge variant='outline'>Read</Badge>
    case 'acknowledged':
      return <Badge variant='default'>Acknowledged</Badge>
    case 'ignored':
      return <Badge variant='secondary'>Ignored</Badge>
    case 'resolved':
      return <Badge variant='outline'>Resolved</Badge>
    default:
      return <Badge variant='secondary'>Unread</Badge>
  }
}

export function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onActionComplete,
}: NotificationDetailModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  if (!notification) return null

  const status = notification.response?.status
  const isRead = status === 'read'
  const isAcknowledged = status === 'acknowledged'
  const isIgnored = status === 'ignored'
  const isResolved = status === 'resolved'

  const handleAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
    shouldClose = false
  ) => {
    try {
      setIsProcessing(true)
      await action()
      toast.success(successMessage)
      onActionComplete?.()
      if (shouldClose) {
        onClose()
      }
    } catch (error) {
      console.error('Failed to perform action:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to perform action'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkAsRead = () =>
    handleAction(
      () => markNotificationAsRead(notification.id),
      'Notification marked as read'
    )

  const handleAcknowledge = () =>
    handleAction(
      () => acknowledgeNotification(notification.id),
      'Notification acknowledged'
    )

  const handleIgnore = () =>
    handleAction(
      () => ignoreNotification(notification.id),
      'Notification ignored'
    )

  const handleResolve = () =>
    handleAction(
      () => resolveNotification(notification.id),
      'Notification resolved'
    )

  const handleDelete = async () => {
    try {
      setIsProcessing(true)
      await deleteNotification(notification.id)
      toast.success('Notification deleted')
      onActionComplete?.()
      onClose()
    } catch (error) {
      console.error('Failed to delete notification:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete notification'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {getNotificationIcon(notification.type)}
            {notification.title}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>Status:</span>
            {getStatusBadge(notification.response)}
          </div>

          <div className='space-y-2'>
            <div className='text-sm font-medium'>Message</div>
            <div className='text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-muted rounded-md'>
              {notification.message}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='font-medium'>Type:</span>{' '}
              <span className='text-muted-foreground capitalize'>
                {notification.type}
              </span>
            </div>
            <div>
              <span className='font-medium'>Date:</span>{' '}
              <span className='text-muted-foreground'>
                {formatDistanceToNow(notification.createdAt, {
                  addSuffix: true,
                })}
              </span>
            </div>
            <div>
              <span className='font-medium'>Target:</span>{' '}
              <span className='text-muted-foreground'>
                {notification.targetUser
                  ? notification.targetUser.name
                  : 'Organization'}
              </span>
            </div>
            {notification.response && (
              <div>
                <span className='font-medium'>Response Date:</span>{' '}
                <span className='text-muted-foreground'>
                  {notification.response.readAt
                    ? formatDistanceToNow(notification.response.readAt, {
                        addSuffix: true,
                      })
                    : notification.response.acknowledgedAt
                      ? formatDistanceToNow(
                          notification.response.acknowledgedAt,
                          {
                            addSuffix: true,
                          }
                        )
                      : notification.response.resolvedAt
                        ? formatDistanceToNow(
                            notification.response.resolvedAt,
                            {
                              addSuffix: true,
                            }
                          )
                        : notification.response.ignoredAt
                          ? formatDistanceToNow(
                              notification.response.ignoredAt,
                              {
                                addSuffix: true,
                              }
                            )
                          : 'N/A'}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className='flex-col sm:flex-row sm:justify-between gap-2'>
          <div className='flex flex-wrap gap-2'>
            {!isRead && (
              <Button
                variant='outline'
                onClick={handleMarkAsRead}
                disabled={isProcessing}
                className='flex items-center gap-2'
              >
                <Eye className='h-4 w-4' />
                Mark as read
              </Button>
            )}
            {!isAcknowledged && (
              <Button
                variant='outline'
                onClick={handleAcknowledge}
                disabled={isProcessing}
                className='flex items-center gap-2'
              >
                <CheckCircle2 className='h-4 w-4' />
                Acknowledge
              </Button>
            )}
            {!isIgnored && (
              <Button
                variant='outline'
                onClick={handleIgnore}
                disabled={isProcessing}
                className='flex items-center gap-2'
              >
                <Ban className='h-4 w-4' />
                Ignore
              </Button>
            )}
            {!isResolved && (
              <Button
                variant='outline'
                onClick={handleResolve}
                disabled={isProcessing}
                className='flex items-center gap-2'
              >
                <CheckCircle className='h-4 w-4' />
                Resolve
              </Button>
            )}
            <ConfirmAction
              onConfirm={handleDelete}
              renderTrigger={({ open }) => (
                <Button
                  variant='destructive'
                  onClick={open}
                  disabled={isProcessing}
                  className='flex items-center gap-2'
                >
                  <Trash2 className='h-4 w-4' />
                  Delete
                </Button>
              )}
              confirmMessage='Are you sure you want to delete this notification?'
              confirmDescription={
                notification.title
                  ? `"${notification.title}"`
                  : 'This action cannot be undone.'
              }
            />
          </div>
          <Button variant='outline' onClick={onClose} disabled={isProcessing}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
