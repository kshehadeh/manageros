'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getUnreadNotifications,
  getUnreadNotificationCount,
} from '@/lib/actions/notification'
import { NotificationWithResponse } from '@/lib/actions/notification'

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

  // Refs for managing intervals and visibility
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(true)
  const lastNotificationCountRef = useRef(0)

  const loadNotifications = useCallback(async () => {
    if (!enabled) return

    try {
      // First check live count for efficiency
      const liveResponse = await fetch('/api/notifications/live')
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
    } finally {
      setIsLoading(false)
    }
  }, [enabled, limit])

  // Start polling function
  const startPolling = useCallback(() => {
    if (!enabled) return

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current && enabled) {
        loadNotifications()
      }
    }, pollInterval)
  }, [enabled, loadNotifications, pollInterval])

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

      if (isVisibleRef.current && enabled) {
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
  }, [enabled, loadNotifications, startPolling, stopPolling])

  // Initial load and start polling
  useEffect(() => {
    if (enabled) {
      loadNotifications()
      startPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, loadNotifications, startPolling, stopPolling])

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
    refresh,
    startPolling,
    stopPolling,
  }
}
