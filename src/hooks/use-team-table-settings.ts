'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { SortingState } from '@tanstack/react-table'
import {
  getTeamTableSettings,
  updateTeamTableSettings,
} from '@/lib/user-settings'

interface TeamTableSettings {
  sorting: SortingState
  grouping: string
  sort: {
    field: string
    direction: 'asc' | 'desc'
  }
  filters: {
    search: string
    parentId: string
  }
}

interface UseTeamTableSettingsOptions {
  settingsId: string
  enabled?: boolean
}

/**
 * Custom hook for managing per-view team table settings
 * Automatically handles loading/saving settings based on the current user and view ID
 */
export function useTeamTableSettings({
  settingsId,
  enabled = true,
}: UseTeamTableSettingsOptions) {
  const { user, isLoaded: clerkLoaded } = useUser()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  // Get user ID from API
  useEffect(() => {
    if (clerkLoaded && user) {
      fetch('/api/user/current')
        .then(res => res.json())
        .then(data => setUserId(data.user?.id))
        .catch(() => {})
    } else {
      setUserId(undefined)
    }
  }, [clerkLoaded, user])
  const [settings, setSettings] = useState<TeamTableSettings>({
    sorting: [],
    grouping: 'parent',
    sort: {
      field: '',
      direction: 'asc',
    },
    filters: {
      search: '',
      parentId: '',
    },
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings when user changes or settingsId changes
  useEffect(() => {
    if (userId && enabled) {
      const loadedSettings = getTeamTableSettings(userId, settingsId)
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
      updateTeamTableSettings(userId, settingsId, { sorting })
    },
    [userId, settingsId, enabled]
  )

  // Update grouping
  const updateGrouping = useCallback(
    (grouping: string) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, grouping }))
      updateTeamTableSettings(userId, settingsId, { grouping })
    },
    [userId, settingsId, enabled]
  )

  // Update sort
  const updateSort = useCallback(
    (sort: { field: string; direction: 'asc' | 'desc' }) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, sort }))
      updateTeamTableSettings(userId, settingsId, { sort })
    },
    [userId, settingsId, enabled]
  )

  // Update filters
  const updateFilters = useCallback(
    (filters: Partial<TeamTableSettings['filters']>) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        const newSettings = {
          ...prev,
          filters: { ...prev.filters, ...filters },
        }

        // Save to localStorage using the new settings
        updateTeamTableSettings(userId, settingsId, {
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

    const defaultSettings: TeamTableSettings = {
      sorting: [],
      grouping: 'parent',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        parentId: '',
      },
    }

    setSettings(defaultSettings)
    updateTeamTableSettings(userId, settingsId, defaultSettings)
  }, [userId, settingsId, enabled])

  return useMemo(
    () => ({
      settings,
      isLoaded,
      updateSorting,
      updateGrouping,
      updateSort,
      updateFilters,
      resetSettings,
    }),
    [
      settings,
      isLoaded,
      updateSorting,
      updateGrouping,
      updateSort,
      updateFilters,
      resetSettings,
    ]
  )
}
