'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'
import { SortingState } from '@tanstack/react-table'
import {
  getMeetingTableSettings,
  updateMeetingTableSettings,
} from '@/lib/user-settings'

interface MeetingTableSettings {
  sorting: SortingState
  grouping: string
  sort: {
    field: string
    direction: 'asc' | 'desc'
  }
  filters: {
    search: string
    teamId: string[]
    initiativeId: string[]
    scheduledFrom: string
    scheduledTo: string
    meetingType: string
  }
}

interface UseMeetingTableSettingsOptions {
  settingsId: string
  enabled?: boolean
}

/**
 * Custom hook for managing per-view meeting table settings
 * Automatically handles loading/saving settings based on the current user and view ID
 */
export function useMeetingTableSettings({
  settingsId,
  enabled = true,
}: UseMeetingTableSettingsOptions) {
  const { user } = useUser()

  // Use Clerk user ID directly (available immediately, no API call needed)
  const userId = user?.id
  const [settings, setSettings] = useState<MeetingTableSettings>({
    sorting: [],
    grouping: 'none',
    sort: {
      field: '',
      direction: 'asc',
    },
    filters: {
      search: '',
      teamId: [],
      initiativeId: [],
      scheduledFrom: '',
      scheduledTo: '',
      meetingType: '',
    },
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings when user changes or settingsId changes
  useEffect(() => {
    if (userId && enabled) {
      const loadedSettings = getMeetingTableSettings(userId, settingsId)
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
      updateMeetingTableSettings(userId, settingsId, { sorting })
    },
    [userId, settingsId, enabled]
  )

  // Update grouping
  const updateGrouping = useCallback(
    (grouping: string) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, grouping }))
      updateMeetingTableSettings(userId, settingsId, { grouping })
    },
    [userId, settingsId, enabled]
  )

  // Update sort
  const updateSort = useCallback(
    (sort: { field: string; direction: 'asc' | 'desc' }) => {
      if (!userId || !enabled) return

      setSettings(prev => ({ ...prev, sort }))
      updateMeetingTableSettings(userId, settingsId, { sort })
    },
    [userId, settingsId, enabled]
  )

  // Update filters
  const updateFilters = useCallback(
    (
      filters: Partial<{
        search?: string
        teamId?: string | string[]
        initiativeId?: string | string[]
        scheduledFrom?: string
        scheduledTo?: string
        meetingType?: string
      }>
    ) => {
      if (!userId || !enabled) return

      setSettings(prev => {
        // Normalize filter arrays (convert strings to arrays)
        const normalizedFilters: Partial<MeetingTableSettings['filters']> = {}

        if (filters.search !== undefined) {
          normalizedFilters.search = filters.search
        }
        if (filters.teamId !== undefined) {
          normalizedFilters.teamId = Array.isArray(filters.teamId)
            ? filters.teamId
            : [filters.teamId]
        }
        if (filters.initiativeId !== undefined) {
          normalizedFilters.initiativeId = Array.isArray(filters.initiativeId)
            ? filters.initiativeId
            : [filters.initiativeId]
        }
        if (filters.scheduledFrom !== undefined) {
          normalizedFilters.scheduledFrom = filters.scheduledFrom
        }
        if (filters.scheduledTo !== undefined) {
          normalizedFilters.scheduledTo = filters.scheduledTo
        }
        if (filters.meetingType !== undefined) {
          normalizedFilters.meetingType = filters.meetingType
        }

        const newSettings = {
          ...prev,
          filters: { ...prev.filters, ...normalizedFilters },
        }

        // Save to localStorage using the new settings
        updateMeetingTableSettings(userId, settingsId, {
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

    const defaultSettings: MeetingTableSettings = {
      sorting: [],
      grouping: 'none',
      sort: {
        field: '',
        direction: 'asc',
      },
      filters: {
        search: '',
        teamId: [],
        initiativeId: [],
        scheduledFrom: '',
        scheduledTo: '',
        meetingType: '',
      },
    }

    setSettings(defaultSettings)
    updateMeetingTableSettings(userId, settingsId, defaultSettings)
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
