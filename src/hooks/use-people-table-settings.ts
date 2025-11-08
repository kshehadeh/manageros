'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'
import { SortingState } from '@tanstack/react-table'
import {
  getPeopleTableSettings,
  updatePeopleTableSettings,
} from '@/lib/user-settings'

interface PeopleTableSettings {
  sorting: SortingState
  grouping: string
  sort: {
    field: string
    direction: 'asc' | 'desc'
  }
  filters: {
    search: string
    teamId: string
    managerId: string
    jobRoleId: string
    status: string
  }
}

interface UsePeopleTableSettingsOptions {
  settingsId: string
  enabled?: boolean
}

/**
 * Custom hook for managing per-view people table settings
 * Automatically handles loading/saving settings based on the current user and view ID
 */
export function usePeopleTableSettings({
  settingsId,
  enabled = true,
}: UsePeopleTableSettingsOptions) {
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
  const [settings, setSettings] = useState<PeopleTableSettings>({
    sorting: [],
    grouping: 'team',
    sort: {
      field: '',
      direction: 'asc',
    },
    filters: {
      search: '',
      teamId: '',
      managerId: '',
      jobRoleId: '',
      status: '',
    },
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings when user changes or settingsId changes
  useEffect(() => {
    if (userId && enabled) {
      const loadedSettings = getPeopleTableSettings(userId, settingsId)
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
      updatePeopleTableSettings(userId, settingsId, { sorting })
    },
    [userId, settingsId, enabled]
  )

  // Update grouping
  const updateGrouping = useCallback(
    (grouping: string) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, grouping }))
      updatePeopleTableSettings(userId, settingsId, { grouping })
    },
    [userId, settingsId, enabled]
  )

  // Update sort
  const updateSort = useCallback(
    (sort: { field: string; direction: 'asc' | 'desc' }) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, sort }))
      updatePeopleTableSettings(userId, settingsId, { sort })
    },
    [userId, settingsId, enabled]
  )

  // Update filters
  const updateFilters = useCallback(
    (filters: Partial<PeopleTableSettings['filters']>) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        const newSettings = {
          ...prev,
          filters: { ...prev.filters, ...filters },
        }

        // Save to localStorage using the new settings
        updatePeopleTableSettings(userId, settingsId, {
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

    const defaultSettings: PeopleTableSettings = {
      sorting: [],
      grouping: 'team',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        teamId: '',
        managerId: '',
        jobRoleId: '',
        status: '',
      },
    }

    setSettings(defaultSettings)
    updatePeopleTableSettings(userId, settingsId, defaultSettings)
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
