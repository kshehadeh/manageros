'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  getAllUserNotifications,
  markNotificationAsRead,
} from '@/lib/actions/notification'
import { NotificationWithResponse } from '@/lib/actions/notification'
import { formatDistanceToNow } from 'date-fns'
import {
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
} from 'lucide-react'

interface NotificationsListProps {
  showAllOrganizationNotifications?: boolean
}

export function NotificationsList({
  showAllOrganizationNotifications = false,
}: NotificationsListProps) {
  const [notifications, setNotifications] = useState<
    NotificationWithResponse[]
  >([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const loadNotifications = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        if (append) {
          setIsLoadingMore(true)
        } else {
          setIsLoading(true)
        }

        const result = await getAllUserNotifications(
          page,
          20,
          showAllOrganizationNotifications
        )

        if (append) {
          setNotifications(prev => [...prev, ...result.notifications])
        } else {
          setNotifications(result.notifications)
        }

        setTotalPages(result.totalPages)
        setCurrentPage(page)
      } catch (error) {
        console.error('Failed to load notifications:', error)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [showAllOrganizationNotifications]
  )

  const refreshNotifications = useCallback(async () => {
    await loadNotifications(1, false)
  }, [loadNotifications])

  useEffect(() => {
    loadNotifications(1)

    // Auto-refresh every 60 seconds (less frequent for full list)
    const interval = setInterval(() => {
      refreshNotifications()
    }, 60000)

    return () => clearInterval(interval)
  }, [
    refreshNotifications,
    showAllOrganizationNotifications,
    loadNotifications,
  ])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? {
                ...notification,
                response: notification.response
                  ? {
                      ...notification.response,
                      status: 'read',
                      readAt: new Date(),
                    }
                  : {
                      id: '',
                      status: 'read',
                      readAt: new Date(),
                      dismissedAt: null,
                    },
              }
            : notification
        )
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      loadNotifications(currentPage + 1, true)
    }
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
      default:
        return <Badge variant='secondary'>Unread</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className='flex items-start gap-3 p-4 border rounded-lg animate-pulse'
          >
            <div className='h-6 w-6 rounded-full bg-muted' />
            <div className='flex-1 space-y-2'>
              <div className='h-4 w-3/4 bg-muted rounded' />
              <div className='h-3 w-full bg-muted rounded' />
              <div className='h-3 w-1/2 bg-muted rounded' />
            </div>
            <div className='flex gap-2'>
              <div className='h-8 w-20 bg-muted rounded' />
              <div className='h-8 w-20 bg-muted rounded' />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground'>No notifications found</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {notifications.map((notification, index) => (
        <div key={notification.id}>
          <div className='flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors'>
            <div className='mt-1'>{getNotificationIcon(notification.type)}</div>

            <div className='flex-1 min-w-0'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-2'>
                    <h3 className='font-medium text-foreground'>
                      {notification.title}
                    </h3>
                    {getStatusBadge(notification.response)}
                  </div>

                  <p className='text-sm text-muted-foreground mb-2'>
                    {notification.message}
                  </p>

                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <span>
                      {formatDistanceToNow(notification.createdAt, {
                        addSuffix: true,
                      })}
                    </span>
                    {notification.targetUser && (
                      <>
                        <span>•</span>
                        <span>To: {notification.targetUser.name}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className='flex gap-2'>
                  {(!notification.response ||
                    notification.response.status === 'unread') && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {index < notifications.length - 1 && <Separator />}
        </div>
      ))}

      {currentPage < totalPages && (
        <div className='flex justify-center pt-4'>
          <Button
            variant='outline'
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className='flex items-center gap-2'
          >
            {isLoadingMore ? (
              'Loading...'
            ) : (
              <>
                Load more
                <ChevronRight className='h-4 w-4' />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
