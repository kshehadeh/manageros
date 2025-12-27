'use client'

import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { SortingState } from '@tanstack/react-table'
import {
  getInitiativeTableSettings,
  updateInitiativeTableSettings,
} from '@/lib/user-settings'
import { initiativeTableUrlConfig } from '@/lib/table-url-config'

// Export URL config for use in data table config
export { initiativeTableUrlConfig }

interface InitiativeTableSettings {
  sorting: SortingState
  grouping: string
  sort: {
    field: string
    direction: 'asc' | 'desc'
  }
  filters: {
    search: string
    teamId: string[]
    ownerId: string[]
    rag: string[]
    status: string[]
    dateFrom: string
    dateTo: string
  }
}

interface UseInitiativeTableSettingsOptions {
  settingsId: string
  enabled?: boolean
}

/**
 * Custom hook for managing per-view initiative table settings
 * Automatically handles loading/saving settings based on the current user and view ID
 */
export function useInitiativeTableSettings({
  settingsId,
  enabled = true,
}: UseInitiativeTableSettingsOptions) {
  const { user } = useUser()
  const searchParams = useSearchParams()

  // Use Clerk user ID directly (available immediately, no API call needed)
  const userId = user?.id
  const [settings, setSettings] = useState<InitiativeTableSettings>({
    sorting: [],
    grouping: 'none',
    sort: {
      field: '',
      direction: 'asc',
    },
    filters: {
      search: '',
      teamId: [],
      ownerId: [],
      rag: [],
      status: [],
      dateFrom: '',
      dateTo: '',
    },
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings when user changes or settingsId changes
  useEffect(() => {
    if (userId && enabled) {
      const loadedSettings = getInitiativeTableSettings(userId, settingsId)
      // Normalize filter arrays (handle backward compatibility with string values)
      let normalizedSettings = {
        ...loadedSettings,
        filters: {
          ...loadedSettings.filters,
          teamId: Array.isArray(loadedSettings.filters.teamId)
            ? loadedSettings.filters.teamId
            : loadedSettings.filters.teamId
              ? [loadedSettings.filters.teamId]
              : [],
          ownerId: Array.isArray(loadedSettings.filters.ownerId)
            ? loadedSettings.filters.ownerId
            : loadedSettings.filters.ownerId
              ? [loadedSettings.filters.ownerId]
              : [],
          rag: Array.isArray(loadedSettings.filters.rag)
            ? loadedSettings.filters.rag
            : loadedSettings.filters.rag
              ? [loadedSettings.filters.rag]
              : [],
          status: Array.isArray(loadedSettings.filters.status)
            ? loadedSettings.filters.status
            : loadedSettings.filters.status
              ? [loadedSettings.filters.status]
              : [],
        },
      }

      // Merge URL params into settings if present (for all filters, sort, and grouping)
      // This ensures the filter UI reflects URL params when navigating from external links
      if (settingsId === 'default') {
        const config = initiativeTableUrlConfig

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
      updateInitiativeTableSettings(userId, settingsId, { sorting })
    },
    [userId, settingsId, enabled]
  )

  // Update grouping
  const updateGrouping = useCallback(
    (grouping: string) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, grouping }))
      updateInitiativeTableSettings(userId, settingsId, { grouping })
    },
    [userId, settingsId, enabled]
  )

  // Update sort
  const updateSort = useCallback(
    (sort: { field: string; direction: 'asc' | 'desc' }) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, sort }))
      updateInitiativeTableSettings(userId, settingsId, { sort })
    },
    [userId, settingsId, enabled]
  )

  // Update filters
  const updateFilters = useCallback(
    (
      filters: Partial<{
        search?: string
        teamId?: string | string[]
        ownerId?: string | string[]
        rag?: string | string[]
        status?: string | string[]
        dateFrom?: string
        dateTo?: string
      }>
    ) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        // Normalize filter arrays (convert strings to arrays)
        const normalizedFilters: Partial<InitiativeTableSettings['filters']> =
          {}

        if (filters.search !== undefined) {
          normalizedFilters.search = filters.search
        }
        if (filters.teamId !== undefined) {
          normalizedFilters.teamId = Array.isArray(filters.teamId)
            ? filters.teamId
            : [filters.teamId]
        }
        if (filters.ownerId !== undefined) {
          normalizedFilters.ownerId = Array.isArray(filters.ownerId)
            ? filters.ownerId
            : [filters.ownerId]
        }
        if (filters.rag !== undefined) {
          normalizedFilters.rag = Array.isArray(filters.rag)
            ? filters.rag
            : [filters.rag]
        }
        if (filters.status !== undefined) {
          normalizedFilters.status = Array.isArray(filters.status)
            ? filters.status
            : [filters.status]
        }
        if (filters.dateFrom !== undefined) {
          normalizedFilters.dateFrom = filters.dateFrom
        }
        if (filters.dateTo !== undefined) {
          normalizedFilters.dateTo = filters.dateTo
        }

        const newSettings = {
          ...prev,
          filters: { ...prev.filters, ...normalizedFilters },
        }

        // Save to localStorage using the new settings
        updateInitiativeTableSettings(userId, settingsId, {
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

    const defaultSettings: InitiativeTableSettings = {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        teamId: [],
        ownerId: [],
        rag: [],
        status: [],
        dateFrom: '',
        dateTo: '',
      },
    }

    setSettings(defaultSettings)
    updateInitiativeTableSettings(userId, settingsId, defaultSettings)
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
