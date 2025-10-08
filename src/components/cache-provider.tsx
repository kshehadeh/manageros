'use client'

import { useEffect } from 'react'
import { useOrganizationCacheStore } from '@/lib/stores/organization-cache-store'

/**
 * Cache Provider Component
 *
 * This component manages cache invalidation by listening for navigation events
 * and invalidating the cache when appropriate. Since server actions can't
 * directly call client-side functions, we use a different approach:
 *
 * 1. Listen for route changes that indicate data mutations
 * 2. Invalidate cache when returning to pages that show people data
 * 3. Use a more aggressive staleness threshold for better UX
 */
export function CacheProvider({ children }: { children: React.ReactNode }) {
  const { invalidatePeople } = useOrganizationCacheStore()

  useEffect(() => {
    // Invalidate cache when navigating to people-related pages
    // This ensures fresh data after mutations
    const handleRouteChange = () => {
      const currentPath = window.location.pathname

      // Invalidate cache when navigating to people pages
      if (
        currentPath.includes('/people') ||
        currentPath.includes('/meetings') ||
        currentPath.includes('/initiatives')
      ) {
        // Use a small delay to ensure the page has loaded
        setTimeout(() => {
          invalidatePeople()
        }, 100)
      }
    }

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange)

    // Also listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function (...args) {
      originalPushState.apply(history, args)
      handleRouteChange()
    }

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args)
      handleRouteChange()
    }

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [invalidatePeople])

  return <>{children}</>
}
