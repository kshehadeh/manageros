'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Eye,
  CheckCircle2,
  Ban,
} from 'lucide-react'
import { NotificationWithResponse } from '@/lib/actions/notification'
import { useNotificationsTable } from '@/hooks/use-notifications-table'
import { useNotificationTableSettings } from '@/hooks/use-notification-table-settings'
import { deleteNotification } from '@/lib/actions/notification'
import type { DataTableConfig } from '@/components/common/generic-data-table'
import {
  DeleteMenuItem,
  ContextMenuItem,
} from '@/components/common/context-menu-items'
import { formatDistanceToNow } from 'date-fns'
import {
  markNotificationAsRead,
  acknowledgeNotification,
  ignoreNotification,
  resolveNotification,
} from '@/lib/actions/notification'
import { toast } from 'sonner'

type NotificationFilters = {
  search?: string
  type?: string
  status?: string
}

export const notificationsDataTableConfig: DataTableConfig<
  NotificationWithResponse,
  NotificationFilters
> = {
  // Entity identification
  entityType: 'notification',
  entityName: 'Notification',
  entityNamePlural: 'notifications',

  // Data fetching
  useDataHook: useNotificationsTable,

  // Settings management
  useSettingsHook: useNotificationTableSettings,

  // Additional props passed to columns
  columnProps: {},

  onRowClick: (_router, _notificationId) => {
    // Notifications don't have detail pages, so no navigation
  },

  // Column definitions
  createColumns: ({ onButtonClick }) => {
    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'success':
          return <CheckCircle className='h-4 w-4 text-green-500' />
        case 'warning':
          return <AlertTriangle className='h-4 w-4 text-yellow-500' />
        case 'error':
          return <XCircle className='h-4 w-4 text-red-500' />
        default:
          return <Info className='h-4 w-4 text-blue-500' />
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

    return [
      {
        id: 'type',
        header: 'Type',
        accessorKey: 'type',
        cell: ({ row }) => {
          const notification = row.original
          return getNotificationIcon(notification.type)
        },
        size: 60,
        minSize: 50,
        maxSize: 80,
        enableSorting: false,
        meta: {
          hidden: false,
        },
      },
      {
        id: 'title',
        header: 'Title',
        accessorKey: 'title',
        cell: ({ row }) => {
          const notification = row.original
          return <div className='font-medium'>{notification.title}</div>
        },
        size: 300,
        minSize: 200,
        maxSize: 500,
        meta: {
          hidden: false,
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: row => {
          // Return the status from response, or 'unread' if no response
          return row.response?.status || 'unread'
        },
        cell: ({ row }) => {
          const notification = row.original
          return getStatusBadge(notification.response)
        },
        size: 120,
        minSize: 100,
        maxSize: 150,
        meta: {
          hidden: false,
        },
      },
      {
        id: 'date',
        header: 'Date',
        accessorKey: 'createdAt',
        cell: ({ row }) => {
          const notification = row.original
          return (
            <span className='text-sm text-muted-foreground'>
              {formatDistanceToNow(notification.createdAt, {
                addSuffix: true,
              })}
            </span>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden: false,
        },
      },
      {
        id: 'target',
        header: 'Target',
        accessorKey: 'targetUser',
        cell: ({ row }) => {
          const notification = row.original
          return (
            <span className='text-sm text-muted-foreground'>
              {notification.targetUser
                ? notification.targetUser.name
                : 'Organization'}
            </span>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden: false,
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const notification = row.original
          return (
            <div className='flex items-center justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={e => {
                  e.stopPropagation()
                  onButtonClick(e, notification.id)
                }}
              >
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </div>
          )
        },
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableSorting: false,
        enableHiding: false,
        meta: {
          hidden: false,
        },
      },
    ]
  },

  // Actions
  deleteAction: deleteNotification,

  // Custom context menu items
  contextMenuItems: ({
    entity,
    close,
    applyOptimisticUpdate,
    removeOptimisticUpdate,
    onDelete,
  }) => {
    const notification = entity as NotificationWithResponse
    const status = notification.response?.status
    const isRead = status === 'read'
    const isAcknowledged = status === 'acknowledged'
    const isIgnored = status === 'ignored'
    const isResolved = status === 'resolved'

    const handleMarkAsRead = async () => {
      try {
        // Optimistically update the UI
        const now = new Date()
        applyOptimisticUpdate(notification.id, {
          response: notification.response
            ? {
                ...notification.response,
                status: 'read',
                readAt: now,
              }
            : {
                id: '',
                status: 'read',
                readAt: now,
                dismissedAt: null,
                acknowledgedAt: null,
                ignoredAt: null,
                resolvedAt: null,
              },
        } as Partial<NotificationWithResponse>)
        await markNotificationAsRead(notification.id)
        // Clear optimistic update after server confirms - the update is now permanent
        // We keep the optimistic update applied since the server action succeeded
        // The optimistic update will persist until the next data fetch, which is fine
        // since it matches the server state
        toast.success('Notification marked as read')
        close()
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
        toast.error('Failed to mark notification as read')
        // Revert optimistic update on error
        removeOptimisticUpdate(notification.id)
      }
    }

    const handleAcknowledge = async () => {
      try {
        // Optimistically update the UI
        const now = new Date()
        applyOptimisticUpdate(notification.id, {
          response: notification.response
            ? {
                ...notification.response,
                status: 'acknowledged',
                acknowledgedAt: now,
              }
            : {
                id: '',
                status: 'acknowledged',
                readAt: null,
                dismissedAt: null,
                acknowledgedAt: now,
                ignoredAt: null,
                resolvedAt: null,
              },
        } as Partial<NotificationWithResponse>)
        await acknowledgeNotification(notification.id)
        toast.success('Notification acknowledged')
        close()
      } catch (error) {
        console.error('Failed to acknowledge notification:', error)
        toast.error('Failed to acknowledge notification')
        removeOptimisticUpdate(notification.id)
      }
    }

    const handleIgnore = async () => {
      try {
        // Optimistically update the UI
        const now = new Date()
        applyOptimisticUpdate(notification.id, {
          response: notification.response
            ? {
                ...notification.response,
                status: 'ignored',
                ignoredAt: now,
              }
            : {
                id: '',
                status: 'ignored',
                readAt: null,
                dismissedAt: null,
                acknowledgedAt: null,
                ignoredAt: now,
                resolvedAt: null,
              },
        } as Partial<NotificationWithResponse>)
        await ignoreNotification(notification.id)
        toast.success('Notification ignored')
        close()
      } catch (error) {
        console.error('Failed to ignore notification:', error)
        toast.error('Failed to ignore notification')
        removeOptimisticUpdate(notification.id)
      }
    }

    const handleResolve = async () => {
      try {
        // Optimistically update the UI
        const now = new Date()
        applyOptimisticUpdate(notification.id, {
          response: notification.response
            ? {
                ...notification.response,
                status: 'resolved',
                resolvedAt: now,
              }
            : {
                id: '',
                status: 'resolved',
                readAt: null,
                dismissedAt: null,
                acknowledgedAt: null,
                ignoredAt: null,
                resolvedAt: now,
              },
        } as Partial<NotificationWithResponse>)
        await resolveNotification(notification.id)
        toast.success('Notification resolved')
        close()
      } catch (error) {
        console.error('Failed to resolve notification:', error)
        toast.error('Failed to resolve notification')
        removeOptimisticUpdate(notification.id)
      }
    }

    return (
      <>
        <ContextMenuItem
          onClick={handleMarkAsRead}
          icon={<Eye className='h-4 w-4' />}
          disabled={isRead}
        >
          Mark as read
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handleAcknowledge}
          icon={<CheckCircle2 className='h-4 w-4' />}
          disabled={isAcknowledged}
        >
          Acknowledge
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handleIgnore}
          icon={<Ban className='h-4 w-4' />}
          disabled={isIgnored}
        >
          Ignore
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handleResolve}
          icon={<CheckCircle className='h-4 w-4' />}
          disabled={isResolved}
        >
          Resolve
        </ContextMenuItem>
        <DeleteMenuItem onDelete={onDelete} close={close} />
      </>
    )
  },

  // UI configuration
  searchPlaceholder: 'Search notifications...',
  emptyMessage: 'No notifications found',
  loadingMessage: 'Loading notifications...',

  // Grouping and sorting options
  groupingOptions: [
    { value: 'none', label: 'No grouping' },
    { value: 'type', label: 'Group by type' },
    { value: 'status', label: 'Group by status' },
  ],
  sortOptions: [
    { value: 'title', label: 'Title' },
    { value: 'createdAt', label: 'Date' },
    { value: 'type', label: 'Type' },
  ],

  // Group label formatting
  getGroupLabel: (groupValue: string, groupingColumn: string) => {
    if (groupingColumn === 'type') {
      // Capitalize first letter: "warning" -> "Warning", "error" -> "Error", etc.
      return groupValue.charAt(0).toUpperCase() + groupValue.slice(1)
    }
    if (groupingColumn === 'status') {
      // Format status labels
      switch (groupValue) {
        case 'unread':
          return 'Unread'
        case 'read':
          return 'Read'
        case 'acknowledged':
          return 'Acknowledged'
        case 'ignored':
          return 'Ignored'
        case 'resolved':
          return 'Resolved'
        default:
          return groupValue || 'Unread'
      }
    }
    return groupValue || 'Unassigned'
  },

  // Group ordering - ensure Unread comes first when grouping by status
  getGroupOrder: (groupValue: string, groupingColumn: string) => {
    if (groupingColumn === 'status') {
      // Define order: unread first, then others alphabetically
      const statusOrder: Record<string, number> = {
        unread: 0,
        read: 1,
        acknowledged: 2,
        ignored: 3,
        resolved: 4,
      }
      return statusOrder[groupValue] ?? 999
    }
    // For other grouping columns, use default alphabetical order
    return Infinity
  },
}
