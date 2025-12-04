'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  WifiOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import { Link } from '@/components/ui/link'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationStatusDropdown } from '@/components/notifications/notification-status-dropdown'
import { NOTIFICATION_UPDATED_EVENT } from '@/lib/notification-events'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    isLoading,
    hasNewNotifications,
    isOffline,
    refresh,
  } = useNotifications({ limit: 5, pollInterval: 30000 })

  // Listen for notification update events from other components
  useEffect(() => {
    const handleNotificationUpdate = () => {
      refresh()
    }

    window.addEventListener(
      NOTIFICATION_UPDATED_EVENT,
      handleNotificationUpdate
    )

    return () => {
      window.removeEventListener(
        NOTIFICATION_UPDATED_EVENT,
        handleNotificationUpdate
      )
    }
  }, [refresh])

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

  if (isLoading) {
    return (
      <Button variant='ghost' size='icon' className={className}>
        <Bell className='h-5 w-5' />
      </Button>
    )
  }

  return (
    <div className='relative'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} ${hasNewNotifications ? 'animate-pulse' : ''} ${
          isOffline ? 'opacity-50' : ''
        }`}
        disabled={isOffline}
        title={
          isOffline ? 'Notifications unavailable offline' : 'Notifications'
        }
      >
        {isOffline ? (
          <WifiOff className='h-5 w-5 text-muted-foreground' />
        ) : (
          <Bell className='h-5 w-5' />
        )}
        {!isOffline && unreadCount > 0 && (
          <Badge
            variant='destructive'
            className='absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center'
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
        {!isOffline && hasNewNotifications && unreadCount === 0 && (
          <div className='absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-ping' />
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className='fixed inset-0 z-40'
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <Card className='absolute right-0 top-12 w-80 z-50 shadow-lg rounded-sm'>
            <CardHeader className='py-sm px-smborder-b border-border bg-muted'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-base font-medium font-mono'>
                  Notifications
                </CardTitle>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setIsOpen(false)}
                  className='h-6 w-6'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </CardHeader>

            <CardContent className='p-lg! flex flex-col max-h-[500px]'>
              <ScrollArea className='flex-1 min-h-0'>
                {isOffline ? (
                  <div className='p-3 text-center text-muted-foreground text-sm'>
                    <WifiOff className='h-8 w-8 mx-auto mb-2 opacity-50' />
                    <p>Notifications unavailable offline</p>
                    <p className='text-xs mt-1'>
                      Connect to the internet to see notifications
                    </p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className='p-3 text-center text-muted-foreground text-sm'>
                    No unread notifications
                  </div>
                ) : (
                  <div className='space-y-1'>
                    {notifications.map((notification, index) => (
                      <div key={notification.id}>
                        <div className='py-sm hover:bg-muted/50 transition-colors'>
                          <div className='flex items-start gap-2'>
                            <div className='flex-shrink-0'>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className='flex-1 min-w-0 overflow-hidden'>
                              <p className='text-xs font-medium text-foreground truncate'>
                                {notification.title}
                              </p>
                              <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>
                                {notification.message}
                              </p>
                              <p className='text-xs text-muted-foreground mt-1'>
                                {formatDistanceToNow(notification.createdAt, {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            <div className='flex-shrink-0'>
                              <NotificationStatusDropdown
                                notification={notification}
                                onActionComplete={refresh}
                                size='sm'
                                align='right'
                              />
                            </div>
                          </div>
                        </div>
                        {index < notifications.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {!isOffline && (
                <>
                  <Separator />
                  <div className='p-2 flex-shrink-0'>
                    <Link href='/notifications'>
                      <Button variant='outline' size='sm' className='w-full'>
                        See all notifications
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
