'use client'

import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { SortingState } from '@tanstack/react-table'
import {
  getOneOnOneTableSettings,
  updateOneOnOneTableSettings,
} from '@/lib/user-settings'
import { oneOnOneTableUrlConfig } from '@/lib/table-url-config'

// Export URL config for use in data table config
export { oneOnOneTableUrlConfig }

interface OneOnOneTableSettings {
  sorting: SortingState
  grouping: string
  sort: {
    field: string
    direction: 'asc' | 'desc'
  }
  filters: {
    search: string
    scheduledFrom: string
    scheduledTo: string
  }
}

interface UseOneOnOneTableSettingsOptions {
  settingsId: string
  enabled?: boolean
}

/**
 * Custom hook for managing per-view one-on-one table settings
 * Automatically handles loading/saving settings based on the current user and view ID
 */
export function useOneOnOneTableSettings({
  settingsId,
  enabled = true,
}: UseOneOnOneTableSettingsOptions) {
  const { user } = useUser()
  const searchParams = useSearchParams()

  // Use Clerk user ID directly (available immediately, no API call needed)
  const userId = user?.id
  const [settings, setSettings] = useState<OneOnOneTableSettings>({
    sorting: [],
    grouping: 'none',
    sort: {
      field: '',
      direction: 'asc',
    },
    filters: {
      search: '',
      scheduledFrom: '',
      scheduledTo: '',
    },
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings when user changes or settingsId changes
  useEffect(() => {
    if (userId && enabled) {
      const loadedSettings = getOneOnOneTableSettings(userId, settingsId)
      let normalizedSettings = loadedSettings

      // Merge URL params into settings if present
      if (settingsId === 'default') {
        const config = oneOnOneTableUrlConfig

        // Read each filter from URL params
        for (const [filterKey, paramName] of Object.entries(
          config.filterParamMap
        )) {
          const paramValue = searchParams.get(paramName)
          if (paramValue) {
            normalizedSettings = {
              ...normalizedSettings,
              filters: {
                ...normalizedSettings.filters,
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
            normalizedSettings = {
              ...normalizedSettings,
              sort: { field, direction: direction as 'asc' | 'desc' },
            }
          }
        }

        // Read grouping from URL
        const groupingParam = searchParams.get(
          config.groupingParamName || 'grouping'
        )
        if (groupingParam) {
          normalizedSettings = {
            ...normalizedSettings,
            grouping: groupingParam,
          }
        }
      }

      setSettings(normalizedSettings)
      setIsLoaded(true)
    } else {
      setIsLoaded(false)
    }
  }, [userId, settingsId, enabled, searchParams])

  // Update sorting
  const updateSorting = useCallback(
    (sorting: SortingState) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, sorting }))
      updateOneOnOneTableSettings(userId, settingsId, { sorting })
    },
    [userId, settingsId, enabled]
  )

  // Update grouping
  const updateGrouping = useCallback(
    (grouping: string) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, grouping }))
      updateOneOnOneTableSettings(userId, settingsId, { grouping })
    },
    [userId, settingsId, enabled]
  )

  // Update sort
  const updateSort = useCallback(
    (sort: { field: string; direction: 'asc' | 'desc' }) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, sort }))
      updateOneOnOneTableSettings(userId, settingsId, { sort })
    },
    [userId, settingsId, enabled]
  )

  // Update filters
  const updateFilters = useCallback(
    (filters: Partial<OneOnOneTableSettings['filters']>) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        const newSettings = {
          ...prev,
          filters: { ...prev.filters, ...filters },
        }

        // Save to localStorage using the new settings
        updateOneOnOneTableSettings(userId, settingsId, {
          filters: newSettings.filters,
        })

        return newSettings
      })
    },
    [userId, settingsId, enabled]
  )

  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    if (!userId || !enabled) return

    const defaultSettings: OneOnOneTableSettings = {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        scheduledFrom: '',
        scheduledTo: '',
      },
    }

    setSettings(defaultSettings)
    updateOneOnOneTableSettings(userId, settingsId, defaultSettings)
  }, [userId, settingsId, enabled])

  return {
    settings,
    isLoaded,
    updateSorting,
    updateGrouping,
    updateSort,
    updateFilters,
    resetSettings,
  }
}
