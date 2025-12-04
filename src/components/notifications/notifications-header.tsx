'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  RefreshCw,
  MoreVertical,
  Eye,
  CheckCircle2,
  Ban,
  CheckCircle,
} from 'lucide-react'
import { ActionDropdown } from '@/components/common/action-dropdown'
import {
  markAllNotificationsAsRead,
  markAllNotificationsAsAcknowledged,
  markAllNotificationsAsIgnored,
  markAllNotificationsAsResolved,
} from '@/lib/actions/notification'
import { toast } from 'sonner'
import { dispatchNotificationUpdate } from '@/lib/notification-events'

interface NotificationsHeaderProps {
  onRefresh?: () => void
  isAdmin?: boolean
  showAllNotifications?: boolean
  onToggleView?: (_showAll: boolean) => void
  onBulkActionComplete?: () => void
}

export function NotificationsHeader({
  onRefresh,
  isAdmin = false,
  showAllNotifications = false,
  onToggleView,
  onBulkActionComplete,
}: NotificationsHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
  }, [onRefresh])

  const handleBulkAction = useCallback(
    async (action: () => Promise<unknown>, successMessage: string) => {
      try {
        setIsProcessing(true)
        await action()
        toast.success(successMessage)
        dispatchNotificationUpdate()
        onBulkActionComplete?.()
        onRefresh?.()
      } catch (error) {
        console.error('Failed to perform bulk action:', error)
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to perform bulk action'
        )
      } finally {
        setIsProcessing(false)
      }
    },
    [onBulkActionComplete, onRefresh]
  )

  const handleMarkAllAsRead = () =>
    handleBulkAction(
      () => markAllNotificationsAsRead(),
      'All notifications marked as read'
    )

  const handleMarkAllAsAcknowledged = () =>
    handleBulkAction(
      () => markAllNotificationsAsAcknowledged(),
      'All notifications acknowledged'
    )

  const handleMarkAllAsIgnored = () =>
    handleBulkAction(
      () => markAllNotificationsAsIgnored(),
      'All notifications ignored'
    )

  const handleMarkAllAsResolved = () =>
    handleBulkAction(
      () => markAllNotificationsAsResolved(),
      'All notifications resolved'
    )

  return (
    <div className='flex items-center gap-4'>
      {isAdmin && onToggleView && (
        <div className='flex items-center space-x-2'>
          <Switch
            id='view-all-notifications'
            checked={showAllNotifications}
            onCheckedChange={onToggleView}
          />
          <Label htmlFor='view-all-notifications' className='text-sm'>
            View All Users&apos; Notifications
          </Label>
        </div>
      )}
      <ActionDropdown
        trigger={({ toggle }) => (
          <Button
            variant='outline'
            size='sm'
            onClick={toggle}
            disabled={isProcessing}
            className='flex items-center gap-2'
          >
            <MoreVertical className='h-4 w-4' />
            <span className='hidden sm:inline'>Bulk Actions</span>
          </Button>
        )}
      >
        {({ close }) => (
          <div className='py-1'>
            <button
              className='flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left'
              onClick={e => {
                e.stopPropagation()
                handleMarkAllAsRead()
                close()
              }}
              disabled={isProcessing}
            >
              <Eye className='h-4 w-4' />
              Mark all as read
            </button>
            <button
              className='flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left'
              onClick={e => {
                e.stopPropagation()
                handleMarkAllAsAcknowledged()
                close()
              }}
              disabled={isProcessing}
            >
              <CheckCircle2 className='h-4 w-4' />
              Mark all as acknowledged
            </button>
            <button
              className='flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left'
              onClick={e => {
                e.stopPropagation()
                handleMarkAllAsIgnored()
                close()
              }}
              disabled={isProcessing}
            >
              <Ban className='h-4 w-4' />
              Mark all as ignored
            </button>
            <button
              className='flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left'
              onClick={e => {
                e.stopPropagation()
                handleMarkAllAsResolved()
                close()
              }}
              disabled={isProcessing}
            >
              <CheckCircle className='h-4 w-4' />
              Mark all as resolved
            </button>
          </div>
        )}
      </ActionDropdown>
      <Button
        variant='outline'
        size='sm'
        onClick={handleRefresh}
        disabled={isRefreshing || isProcessing}
        className='flex items-center gap-2'
      >
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
        />
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  )
}
