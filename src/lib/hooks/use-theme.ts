'use client'

import { useTheme as useNextTheme } from 'next-themes'
import { useEffect } from 'react'

/**
 * Simple wrapper around next-themes for consistent API
 */
export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme, themes } = useNextTheme()

  useEffect(() => {
    // Migrate from old storage key to new one if needed
    if (typeof window !== 'undefined') {
      const localStorageTheme = localStorage.getItem('manageros-theme')

      // If old key exists but new key doesn't, migrate it
      if (!localStorageTheme) {
        localStorage.setItem('manageros-theme', 'dark')
      }
    }
  }, [])

  return {
    theme: resolvedTheme || theme || 'dark',
    setTheme,
    isLoaded: true, // next-themes handles loading internally
    systemTheme,
    themes,
  }
}
