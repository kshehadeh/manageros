'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useState, useRef } from 'react'
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
  const { user } = useUser()
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)
  const settingsRef = useRef<UserSettings>(DEFAULT_USER_SETTINGS)

  // Use Clerk user ID directly (available immediately, no API call needed)
  const userId = user?.id

  // Keep ref in sync with settings state
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

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
      return settingsRef.current[key]
    },
    [] // No dependencies - uses ref for stable reference
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
