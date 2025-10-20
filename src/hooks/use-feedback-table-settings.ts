'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { SortingState } from '@tanstack/react-table'
import {
  getFeedbackTableSettings,
  updateFeedbackTableSettings,
} from '@/lib/user-settings'

interface FeedbackTableSettings {
  sorting: SortingState
  grouping: string
  sort: {
    field: string
    direction: 'asc' | 'desc'
  }
  filters: {
    search: string
    fromPersonId: string
    aboutPersonId: string
    kind: string
    isPrivate: string
    startDate: string
    endDate: string
  }
}

interface UseFeedbackTableSettingsOptions {
  settingsId: string
  enabled?: boolean
}

/**
 * Custom hook for managing per-view feedback table settings
 * Automatically handles loading/saving settings based on the current user and view ID
 */
export function useFeedbackTableSettings({
  settingsId,
  enabled = true,
}: UseFeedbackTableSettingsOptions) {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<FeedbackTableSettings>({
    sorting: [],
    grouping: 'none',
    sort: {
      field: '',
      direction: 'asc',
    },
    filters: {
      search: '',
      fromPersonId: 'all',
      aboutPersonId: 'all',
      kind: 'all',
      isPrivate: 'all',
      startDate: '',
      endDate: '',
    },
  })
  const [isLoaded, setIsLoaded] = useState(false)

  const userId = session?.user?.id

  // Load settings when user changes or settingsId changes
  useEffect(() => {
    if (userId && enabled) {
      const loadedSettings = getFeedbackTableSettings(userId, settingsId)
      setSettings(loadedSettings)
      setIsLoaded(true)
    } else {
      setIsLoaded(false)
    }
  }, [userId, settingsId, enabled])

  // Update sorting
  const updateSorting = useCallback(
    (sorting: SortingState) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, sorting }))
      updateFeedbackTableSettings(userId, settingsId, { sorting })
    },
    [userId, settingsId, enabled]
  )

  // Update grouping
  const updateGrouping = useCallback(
    (grouping: string) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, grouping }))
      updateFeedbackTableSettings(userId, settingsId, { grouping })
    },
    [userId, settingsId, enabled]
  )

  // Update sort
  const updateSort = useCallback(
    (sort: { field: string; direction: 'asc' | 'desc' }) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, sort }))
      updateFeedbackTableSettings(userId, settingsId, { sort })
    },
    [userId, settingsId, enabled]
  )

  // Update filters
  const updateFilters = useCallback(
    (filters: Partial<FeedbackTableSettings['filters']>) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        const newSettings = {
          ...prev,
          filters: { ...prev.filters, ...filters },
        }

        // Save to localStorage using the new settings
        updateFeedbackTableSettings(userId, settingsId, {
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

    const defaultSettings: FeedbackTableSettings = {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        fromPersonId: 'all',
        aboutPersonId: 'all',
        kind: 'all',
        isPrivate: 'all',
        startDate: '',
        endDate: '',
      },
    }

    setSettings(defaultSettings)
    updateFeedbackTableSettings(userId, settingsId, defaultSettings)
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
