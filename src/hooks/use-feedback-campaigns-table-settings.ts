'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'
import { SortingState } from '@tanstack/react-table'
import {
  getFeedbackCampaignsTableSettings,
  updateFeedbackCampaignsTableSettings,
} from '@/lib/user-settings'

interface FeedbackCampaignsTableSettings {
  sorting: SortingState
  grouping: string
  sort: {
    field: string
    direction: 'asc' | 'desc'
  }
  filters: {
    search: string
    status: string
  }
}

interface UseFeedbackCampaignsTableSettingsOptions {
  settingsId: string
  enabled?: boolean
}

/**
 * Custom hook for managing per-view feedback campaigns table settings
 * Automatically handles loading/saving settings based on the current user and view ID
 */
export function useFeedbackCampaignsTableSettings({
  settingsId,
  enabled = true,
}: UseFeedbackCampaignsTableSettingsOptions) {
  const { user } = useUser()

  // Use Clerk user ID directly (available immediately, no API call needed)
  const userId = user?.id

  const [settings, setSettings] = useState<FeedbackCampaignsTableSettings>({
    sorting: [],
    grouping: 'none',
    sort: {
      field: '',
      direction: 'asc',
    },
    filters: {
      search: '',
      status: 'all',
    },
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings when user changes or settingsId changes
  useEffect(() => {
    if (userId && enabled) {
      const loadedSettings = getFeedbackCampaignsTableSettings(
        userId,
        settingsId
      )
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
      updateFeedbackCampaignsTableSettings(userId, settingsId, { sorting })
    },
    [userId, settingsId, enabled]
  )

  // Update grouping
  const updateGrouping = useCallback(
    (grouping: string) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, grouping }))
      updateFeedbackCampaignsTableSettings(userId, settingsId, { grouping })
    },
    [userId, settingsId, enabled]
  )

  // Update sort
  const updateSort = useCallback(
    (sort: { field: string; direction: 'asc' | 'desc' }) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, sort }))
      updateFeedbackCampaignsTableSettings(userId, settingsId, { sort })
    },
    [userId, settingsId, enabled]
  )

  // Update filters
  const updateFilters = useCallback(
    (filters: Partial<FeedbackCampaignsTableSettings['filters']>) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        const newSettings = {
          ...prev,
          filters: { ...prev.filters, ...filters },
        }

        // Save to localStorage using the new settings
        updateFeedbackCampaignsTableSettings(userId, settingsId, {
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

    const defaultSettings: FeedbackCampaignsTableSettings = {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        status: 'all',
      },
    }

    setSettings(defaultSettings)
    updateFeedbackCampaignsTableSettings(userId, settingsId, defaultSettings)
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
