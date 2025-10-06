'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface OfflineIndicatorProps {
  className?: string
  showReconnectButton?: boolean
  onReconnect?: () => void
}

export function OfflineIndicator({
  className = '',
  showReconnectButton = true,
  onReconnect,
}: OfflineIndicatorProps) {
  const { isOnline, isReconnecting, lastOnlineTime } = useNetworkStatus()
  const [showIndicator, setShowIndicator] = useState(false)

  // Show indicator when going offline, hide after a delay when coming back online
  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true)
    } else if (isOnline && showIndicator) {
      // Hide indicator after 3 seconds when back online
      const timer = setTimeout(() => {
        setShowIndicator(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, showIndicator])

  const handleReconnect = async () => {
    if (onReconnect) {
      await onReconnect()
    } else {
      // Default reconnect behavior - try to fetch a simple resource
      try {
        await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache',
        })
      } catch (error) {
        console.log('Reconnect attempt failed:', error)
      }
    }
  }

  const formatLastOnlineTime = (date: Date | null) => {
    if (!date) return 'Unknown'

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  if (!showIndicator) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-[9999] ${className}`}>
      <Alert
        variant={isOnline ? 'default' : 'destructive'}
        className={`rounded-none border-x-0 border-t-0 ${
          isOnline
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
        }`}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {isOnline ? (
              <Wifi className='h-4 w-4' />
            ) : (
              <WifiOff className='h-4 w-4' />
            )}
            <AlertDescription className='font-medium'>
              {isOnline ? 'Connection restored' : 'You are currently offline'}
            </AlertDescription>
            {!isOnline && lastOnlineTime && (
              <span className='text-sm opacity-75'>
                Last online: {formatLastOnlineTime(lastOnlineTime)}
              </span>
            )}
          </div>

          {!isOnline && showReconnectButton && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleReconnect}
              disabled={isReconnecting}
              className='ml-4'
            >
              {isReconnecting ? (
                <>
                  <RefreshCw className='h-3 w-3 mr-1 animate-spin' />
                  Reconnecting...
                </>
              ) : (
                <>
                  <RefreshCw className='h-3 w-3 mr-1' />
                  Retry
                </>
              )}
            </Button>
          )}
        </div>
      </Alert>
    </div>
  )
}
