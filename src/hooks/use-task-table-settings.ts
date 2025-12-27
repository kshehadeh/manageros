'use client'

import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { SortingState } from '@tanstack/react-table'
import {
  getTaskTableSettings,
  updateTaskTableSettings,
} from '@/lib/user-settings'
import { taskTableUrlConfig } from '@/lib/table-url-config'

// Export URL config for use in data table config
export { taskTableUrlConfig }

interface TaskTableSettings {
  sorting: SortingState
  grouping: string
  sort: {
    field: string
    direction: 'asc' | 'desc'
  }
  filters: {
    search: string
    status: string[]
    assigneeId: string[]
    initiativeId: string[]
    priority: string[]
    dueDateFrom: string
    dueDateTo: string
  }
}

interface UseTaskTableSettingsOptions {
  settingsId: string
  enabled?: boolean
}

/**
 * Custom hook for managing per-view task table settings
 * Automatically handles loading/saving settings based on the current user and view ID
 */
export function useTaskTableSettings({
  settingsId,
  enabled = true,
}: UseTaskTableSettingsOptions) {
  const { user } = useUser()
  const searchParams = useSearchParams()

  // Use Clerk user ID directly (available immediately, no API call needed)
  const userId = user?.id

  const [settings, setSettings] = useState<TaskTableSettings>({
    sorting: [],
    grouping: 'none',
    sort: {
      field: '',
      direction: 'asc',
    },
    filters: {
      search: '',
      status: [],
      assigneeId: [],
      initiativeId: [],
      priority: [],
      dueDateFrom: '',
      dueDateTo: '',
    },
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings when user changes or settingsId changes
  useEffect(() => {
    if (userId && enabled) {
      const loadedSettings = getTaskTableSettings(userId, settingsId)
      let normalizedSettings = loadedSettings

      // Merge URL params into settings if present (for all filters)
      // This ensures the filter UI reflects URL params when navigating from external links
      if (settingsId === 'default') {
        const config = taskTableUrlConfig

        // Read each filter from URL params
        for (const [filterKey, paramName] of Object.entries(
          config.filterParamMap
        )) {
          const paramValue = searchParams.get(paramName)
          if (paramValue) {
            const defaultValue = config.defaultValues[filterKey]
            // Handle comma-separated values for array filters
            if (Array.isArray(defaultValue)) {
              const values = paramValue.split(',').filter(Boolean)
              if (values.length > 0) {
                normalizedSettings = {
                  ...normalizedSettings,
                  filters: {
                    ...normalizedSettings.filters,
                    [filterKey]: values,
                  },
                }
              }
            } else {
              // Single value filter
              normalizedSettings = {
                ...normalizedSettings,
                filters: {
                  ...normalizedSettings.filters,
                  [filterKey]: paramValue,
                },
              }
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
      updateTaskTableSettings(userId, settingsId, { sorting })
    },
    [userId, settingsId, enabled]
  )

  // Update grouping
  const updateGrouping = useCallback(
    (grouping: string) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, grouping }))
      updateTaskTableSettings(userId, settingsId, { grouping })
    },
    [userId, settingsId, enabled]
  )

  // Update sort
  const updateSort = useCallback(
    (sort: { field: string; direction: 'asc' | 'desc' }) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, sort }))
      updateTaskTableSettings(userId, settingsId, { sort })
    },
    [userId, settingsId, enabled]
  )

  // Update filters
  const updateFilters = useCallback(
    (filters: Partial<TaskTableSettings['filters']>) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        const newSettings = {
          ...prev,
          filters: { ...prev.filters, ...filters },
        }

        // Save to localStorage using the new settings
        updateTaskTableSettings(userId, settingsId, {
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

    const defaultSettings: TaskTableSettings = {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        status: [],
        assigneeId: [],
        initiativeId: [],
        priority: [],
        dueDateFrom: '',
        dueDateTo: '',
      },
    }

    setSettings(defaultSettings)
    updateTaskTableSettings(userId, settingsId, defaultSettings)
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
