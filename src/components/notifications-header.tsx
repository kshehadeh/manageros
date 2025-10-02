'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RefreshCw } from 'lucide-react'

interface NotificationsHeaderProps {
  onRefresh?: () => void
  isAdmin?: boolean
  showAllNotifications?: boolean
  onToggleView?: (_showAll: boolean) => void
}

export function NotificationsHeader({
  onRefresh,
  isAdmin = false,
  showAllNotifications = false,
  onToggleView,
}: NotificationsHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

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
      <Button
        variant='outline'
        size='sm'
        onClick={handleRefresh}
        disabled={isRefreshing}
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
