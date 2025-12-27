'use client'

import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { SortingState } from '@tanstack/react-table'
import {
  getNotesTableSettings,
  updateNotesTableSettings,
} from '@/lib/user-settings'
import { notesTableUrlConfig } from '@/lib/table-url-config'

// Export URL config for use in data table config
export { notesTableUrlConfig }

interface NotesTableSettings {
  sorting: SortingState
  grouping: string
  sort: {
    field: string
    direction: 'asc' | 'desc'
  }
  filters: {
    search: string
  }
}

interface UseNotesTableSettingsOptions {
  settingsId: string
  enabled?: boolean
}

/**
 * Custom hook for managing per-view notes table settings
 * Automatically handles loading/saving settings based on the current user and view ID
 */
export function useNotesTableSettings({
  settingsId,
  enabled = true,
}: UseNotesTableSettingsOptions) {
  const { user } = useUser()
  const searchParams = useSearchParams()

  const userId = user?.id

  const [settings, setSettings] = useState<NotesTableSettings>({
    sorting: [],
    grouping: 'none',
    sort: {
      field: '',
      direction: 'asc',
    },
    filters: {
      search: '',
    },
  })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (userId && enabled) {
      const loadedSettings = getNotesTableSettings(userId, settingsId)
      let normalizedSettings = loadedSettings

      // Merge URL params into settings if present
      if (settingsId === 'default') {
        const config = notesTableUrlConfig

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

  const updateSorting = useCallback(
    (sorting: SortingState) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, sorting }))
      updateNotesTableSettings(userId, settingsId, { sorting })
    },
    [userId, settingsId, enabled]
  )

  const updateGrouping = useCallback(
    (grouping: string) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, grouping }))
      updateNotesTableSettings(userId, settingsId, { grouping })
    },
    [userId, settingsId, enabled]
  )

  const updateSort = useCallback(
    (sort: { field: string; direction: 'asc' | 'desc' }) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, sort }))
      updateNotesTableSettings(userId, settingsId, { sort })
    },
    [userId, settingsId, enabled]
  )

  const updateFilters = useCallback(
    (filters: Partial<NotesTableSettings['filters']>) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        const newSettings = {
          ...prev,
          filters: { ...prev.filters, ...filters },
        }

        updateNotesTableSettings(userId, settingsId, {
          filters: newSettings.filters,
        })

        return newSettings
      })
    },
    [userId, settingsId, enabled]
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
