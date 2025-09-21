'use client'

import { useTheme as useNextTheme } from 'next-themes'

/**
 * Simple wrapper around next-themes for consistent API
 */
export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme()

  return {
    theme: resolvedTheme || theme || 'dark',
    setTheme,
    isLoaded: true, // next-themes handles loading internally
  }
}
