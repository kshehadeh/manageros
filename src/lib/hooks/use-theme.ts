'use client'

import { useSession } from 'next-auth/react'
import { useTheme as useNextTheme } from 'next-themes'
import { useCallback, useEffect } from 'react'
import { useUserSettings } from './use-user-settings'

/**
 * Custom hook for managing theme with localStorage integration
 * Combines next-themes functionality with user-specific settings storage
 */
export function useTheme() {
  const { data: session } = useSession()
  const { theme: nextTheme, setTheme: setNextTheme } = useNextTheme()
  const { getSetting, updateSetting, isLoaded } = useUserSettings()

  const userId = session?.user?.id

  // Get the current theme from user settings
  const theme = getSetting('theme')

  // Sync next-themes with user settings when user changes or settings load
  useEffect(() => {
    if (userId && isLoaded && nextTheme !== theme) {
      setNextTheme(theme)
    }
  }, [userId, isLoaded, theme, nextTheme, setNextTheme])

  // Update theme in both next-themes and user settings
  const setTheme = useCallback(
    (newTheme: 'light' | 'dark') => {
      setNextTheme(newTheme)
      if (userId) {
        updateSetting('theme', newTheme)
      }
    },
    [setNextTheme, userId, updateSetting]
  )

  return {
    theme,
    setTheme,
    isLoaded,
  }
}
