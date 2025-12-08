'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'
import { SortingState } from '@tanstack/react-table'
import {
  getNotesTableSettings,
  updateNotesTableSettings,
} from '@/lib/user-settings'

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
      setSettings(loadedSettings)
      setIsLoaded(true)
    } else {
      setIsLoaded(false)
    }
  }, [userId, settingsId, enabled])

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
