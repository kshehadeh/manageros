'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import {
  UserSettings,
  DEFAULT_USER_SETTINGS,
  loadUserSettings,
  saveUserSettings,
  updateUserSetting,
} from '@/lib/user-settings'

/**
 * Custom hook for managing user-specific UI settings
 * Automatically handles loading/saving settings based on the current user
 */
export function useUserSettings() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  const userId = session?.user?.id

  // Load settings when user changes
  useEffect(() => {
    if (userId) {
      const loadedSettings = loadUserSettings(userId)
      setSettings(loadedSettings)
      setIsLoaded(true)
    } else {
      setSettings(DEFAULT_USER_SETTINGS)
      setIsLoaded(false)
    }
  }, [userId])

  // Update a specific setting
  const updateSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      if (!userId) return

      setSettings(prev => ({
        ...prev,
        [key]: value,
      }))

      updateUserSetting(userId, key, value)
    },
    [userId]
  )

  // Get a specific setting value
  const getSetting = useCallback(
    <K extends keyof UserSettings>(key: K): UserSettings[K] => {
      return settings[key]
    },
    [settings]
  )

  // Reset all settings to defaults
  const resetSettings = useCallback(() => {
    if (!userId) return

    setSettings(DEFAULT_USER_SETTINGS)
    saveUserSettings(userId, DEFAULT_USER_SETTINGS)
  }, [userId])

  return {
    settings,
    isLoaded,
    updateSetting,
    getSetting,
    resetSettings,
  }
}
