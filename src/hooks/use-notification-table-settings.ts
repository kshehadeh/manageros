'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'
import { SortingState } from '@tanstack/react-table'

interface NotificationTableSettings {
  sorting: SortingState
  grouping: string
  sort: {
    field: string
    direction: 'asc' | 'desc'
  }
  filters: {
    search: string
    type: string
    status: string
  }
}

interface UseNotificationTableSettingsOptions {
  settingsId: string
  enabled?: boolean
}

/**
 * Custom hook for managing per-view notification table settings
 * Automatically handles loading/saving settings based on the current user and view ID
 */
export function useNotificationTableSettings({
  settingsId,
  enabled = true,
}: UseNotificationTableSettingsOptions) {
  const { user } = useUser()

  // Use Clerk user ID directly (available immediately, no API call needed)
  const userId = user?.id
  const [settings, setSettings] = useState<NotificationTableSettings>({
    sorting: [],
    grouping: 'none',
    sort: {
      field: '',
      direction: 'asc',
    },
    filters: {
      search: '',
      type: '',
      status: '',
    },
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    if (userId && enabled) {
      const key = `notification-table-settings-${userId}-${settingsId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        try {
          setSettings(JSON.parse(stored))
        } catch {
          // Use defaults if parse fails
        }
      }
      setIsLoaded(true)
    } else {
      setIsLoaded(false)
    }
  }, [userId, settingsId, enabled])

  // Save settings to localStorage
  const saveSettings = useCallback(
    (newSettings: NotificationTableSettings) => {
      if (!userId || !enabled) return
      const key = `notification-table-settings-${userId}-${settingsId}`
      localStorage.setItem(key, JSON.stringify(newSettings))
    },
    [userId, settingsId, enabled]
  )

  // Update sorting
  const updateSorting = useCallback(
    (sorting: SortingState) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        const updated = { ...prev, sorting }
        saveSettings(updated)
        return updated
      })
    },
    [userId, enabled, saveSettings]
  )

  // Update grouping
  const updateGrouping = useCallback(
    (grouping: string) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        const updated = { ...prev, grouping }
        saveSettings(updated)
        return updated
      })
    },
    [userId, enabled, saveSettings]
  )

  // Update sort
  const updateSort = useCallback(
    (sort: { field: string; direction: 'asc' | 'desc' }) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        const updated = { ...prev, sort }
        saveSettings(updated)
        return updated
      })
    },
    [userId, enabled, saveSettings]
  )

  // Update filters
  const updateFilters = useCallback(
    (filters: Partial<NotificationTableSettings['filters']>) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        const updated = { ...prev, filters: { ...prev.filters, ...filters } }
        saveSettings(updated)
        return updated
      })
    },
    [userId, enabled, saveSettings]
  )

  return {
    settings,
    isLoaded,
    updateSorting,
    updateGrouping,
    updateSort,
    updateFilters,
  }
}
