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
      const oldStorageTheme = localStorage.getItem('theme') // Check for old key too

      // If old key exists but new key doesn't, migrate it
      if (oldStorageTheme && !localStorageTheme) {
        localStorage.setItem('manageros-theme', oldStorageTheme)
        localStorage.removeItem('theme')
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
