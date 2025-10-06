'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getUnreadNotifications,
  getUnreadNotificationCount,
} from '@/lib/actions/notification'
import { NotificationWithResponse } from '@/lib/actions/notification'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { networkAwareFetch } from '@/lib/network-aware-fetch'

interface UseNotificationsOptions {
  limit?: number
  pollInterval?: number
  enabled?: boolean
}

export function useNotifications({
  limit = 5,
  pollInterval = 30000, // 30 seconds for better server performance
  enabled = true,
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<
    NotificationWithResponse[]
  >([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [_lastCheckTime, setLastCheckTime] = useState<Date>(new Date())
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  // Refs for managing intervals and visibility
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(true)
  const lastNotificationCountRef = useRef(0)

  // Network status
  const { isOnline } = useNetworkStatus({
    onOffline: () => setIsOffline(true),
    onOnline: () => setIsOffline(false),
  })

  const loadNotifications = useCallback(async () => {
    if (!enabled || !isOnline) return

    try {
      // First check live count for efficiency using network-aware fetch
      const liveResponse = await networkAwareFetch('/api/notifications/live', {
        retry: {
          maxRetries: 2,
          retryDelay: 1000,
        },
      })

      if (liveResponse.ok) {
        const liveData = await liveResponse.json()
        const newCount = liveData.count

        // Only fetch full notifications if count changed
        if (newCount !== lastNotificationCountRef.current) {
          const [unreadNotifications] = await Promise.all([
            getUnreadNotifications(limit),
          ])

          setNotifications(unreadNotifications)
          setHasNewNotifications(true)
          // Auto-hide the "new notifications" indicator after 3 seconds
          setTimeout(() => setHasNewNotifications(false), 3000)
        }

        setUnreadCount(newCount)
        lastNotificationCountRef.current = newCount
      } else {
        // Fallback to original method if live endpoint fails
        const [unreadNotifications, count] = await Promise.all([
          getUnreadNotifications(limit),
          getUnreadNotificationCount(),
        ])

        const hasNew =
          count > lastNotificationCountRef.current &&
          lastNotificationCountRef.current > 0
        setHasNewNotifications(hasNew)

        setNotifications(unreadNotifications)
        setUnreadCount(count)
        lastNotificationCountRef.current = count
      }

      setLastCheckTime(new Date())
    } catch (error) {
      console.error('Failed to load notifications:', error)
      // Don't update state on network errors to preserve existing data
      if (error instanceof Error && error.message.includes('Network')) {
        console.log('Network error - preserving existing notification data')
        return
      }
    } finally {
      setIsLoading(false)
    }
  }, [enabled, limit, isOnline])

  // Start polling function
  const startPolling = useCallback(() => {
    if (!enabled || !isOnline) return

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current && enabled && isOnline) {
        loadNotifications()
      }
    }, pollInterval)
  }, [enabled, loadNotifications, pollInterval, isOnline])

  // Stop polling function
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Handle visibility change to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden

      if (isVisibleRef.current && enabled && isOnline) {
        // Resume polling when page becomes visible
        loadNotifications()
        startPolling()
      } else {
        // Pause polling when page is hidden
        stopPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, loadNotifications, startPolling, stopPolling, isOnline])

  // Initial load and start polling
  useEffect(() => {
    if (enabled && isOnline) {
      loadNotifications()
      startPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, loadNotifications, startPolling, stopPolling, isOnline])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  // Manual refresh function
  const refresh = useCallback(() => {
    loadNotifications()
  }, [loadNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    hasNewNotifications,
    isOffline,
    refresh,
    startPolling,
    stopPolling,
  }
}
