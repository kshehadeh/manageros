'use client'

import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { SortingState } from '@tanstack/react-table'
import { notificationsTableUrlConfig } from '@/lib/table-url-config'

// Export URL config for use in data table config
export { notificationsTableUrlConfig }

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
  const searchParams = useSearchParams()

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
      let loadedSettings: NotificationTableSettings = {
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
      }

      if (stored) {
        try {
          loadedSettings = JSON.parse(stored)
        } catch {
          // Use defaults if parse fails
        }
      }

      // Merge URL params into settings if present
      if (settingsId === 'default') {
        const config = notificationsTableUrlConfig

        // Read each filter from URL params
        for (const [filterKey, paramName] of Object.entries(
          config.filterParamMap
        )) {
          const paramValue = searchParams.get(paramName)
          if (paramValue) {
            loadedSettings = {
              ...loadedSettings,
              filters: {
                ...loadedSettings.filters,
                [filterKey]: paramValue,
              },
            }
          }
        }

        // Read sort from URL
        const sortParam = searchParams.get(config.sortParamName || 'sort')
        if (sortParam) {
          const [field, direction] = sortParam.split(':')
          if (field && (direction === 'asc' || direction === 'desc')) {
            loadedSettings = {
              ...loadedSettings,
              sort: { field, direction: direction as 'asc' | 'desc' },
            }
          }
        }

        // Read grouping from URL
        const groupingParam = searchParams.get(
          config.groupingParamName || 'grouping'
        )
        if (groupingParam) {
          loadedSettings = {
            ...loadedSettings,
            grouping: groupingParam,
          }
        }
      }

      setSettings(loadedSettings)
      setIsLoaded(true)
    } else {
      setIsLoaded(false)
    }
  }, [userId, settingsId, enabled, searchParams])

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
