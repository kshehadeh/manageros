'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if the current viewport matches a media query
 * @param query - The media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Set initial value
    setMatches(media.matches)

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    media.addEventListener('change', listener)

    // Cleanup
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

/**
 * Hook to detect if the current viewport is mobile (max-width: 768px)
 * @returns boolean indicating if the viewport is mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)')
}
