'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'
import { SortingState } from '@tanstack/react-table'
import {
  getOrganizationMembersTableSettings,
  updateOrganizationMembersTableSettings,
} from '@/lib/user-settings'

interface OrganizationMembersTableSettings {
  sorting: SortingState
  grouping: string
  sort: {
    field: string
    direction: 'asc' | 'desc'
  }
  filters: {
    search: string
    role: string
  }
}

interface UseOrganizationMembersTableSettingsOptions {
  settingsId: string
  enabled?: boolean
}

/**
 * Custom hook for managing per-view organization members table settings
 * Automatically handles loading/saving settings based on the current user and view ID
 */
export function useOrganizationMembersTableSettings({
  settingsId,
  enabled = true,
}: UseOrganizationMembersTableSettingsOptions) {
  const { user, isLoaded: clerkLoaded } = useUser()
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [settings, setSettings] = useState<OrganizationMembersTableSettings>({
    sorting: [],
    grouping: 'none',
    sort: {
      field: '',
      direction: 'asc',
    },
    filters: {
      search: '',
      role: '',
    },
  })
  const [isLoaded, setIsLoaded] = useState(false)

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

  // Load settings when user changes or settingsId changes
  useEffect(() => {
    if (userId && enabled) {
      const loadedSettings = getOrganizationMembersTableSettings(
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
      updateOrganizationMembersTableSettings(userId, settingsId, { sorting })
    },
    [userId, settingsId, enabled]
  )

  // Update grouping
  const updateGrouping = useCallback(
    (grouping: string) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, grouping }))
      updateOrganizationMembersTableSettings(userId, settingsId, { grouping })
    },
    [userId, settingsId, enabled]
  )

  // Update sort
  const updateSort = useCallback(
    (sort: { field: string; direction: 'asc' | 'desc' }) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, sort }))
      updateOrganizationMembersTableSettings(userId, settingsId, { sort })
    },
    [userId, settingsId, enabled]
  )

  // Update filters
  const updateFilters = useCallback(
    (filters: Partial<OrganizationMembersTableSettings['filters']>) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        const newSettings = {
          ...prev,
          filters: { ...prev.filters, ...filters },
        }

        // Save to localStorage using the new settings
        updateOrganizationMembersTableSettings(userId, settingsId, {
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

    const defaultSettings: OrganizationMembersTableSettings = {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        role: '',
      },
    }

    setSettings(defaultSettings)
    updateOrganizationMembersTableSettings(userId, settingsId, defaultSettings)
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
