'use client'

import { useEffect, useCallback } from 'react'
import { useOrganizationCacheStore } from '@/lib/stores/organization-cache-store'
import { useNetworkStatus } from '@/hooks/use-network-status'

/**
 * Hook for accessing people data with automatic caching and stale-while-revalidate pattern
 *
 * Features:
 * - Returns cached data immediately if available
 * - Triggers background refresh if stale
 * - Auto-fetches on first mount if empty
 * - Network-aware (doesn't fetch when offline)
 * - Stale-while-revalidate: shows old data while refreshing
 */
export function usePeopleCache() {
  const {
    people,
    peopleMetadata,
    fetchPeople,
    invalidatePeople,
    isPeopleStale,
    isPeopleLoading,
    getPeopleError,
  } = useOrganizationCacheStore()

  const { isOnline } = useNetworkStatus()

  // Auto-fetch on mount if no data or stale data
  useEffect(() => {
    const shouldFetch =
      isOnline && // Only fetch when online
      !isPeopleLoading() && // Not already fetching
      (people.length === 0 || isPeopleStale()) // No data or stale data

    if (shouldFetch) {
      fetchPeople()
    }
  }, [isOnline, people.length, isPeopleStale, isPeopleLoading, fetchPeople])

  // Manual refresh function
  const refresh = useCallback(() => {
    if (isOnline && !isPeopleLoading()) {
      fetchPeople()
    }
  }, [isOnline, isPeopleLoading, fetchPeople])

  // Manual invalidation function
  const invalidate = useCallback(() => {
    invalidatePeople()
    // Auto-refresh after invalidation if online
    if (isOnline) {
      fetchPeople()
    }
  }, [invalidatePeople, isOnline, fetchPeople])

  return {
    // Data
    people,

    // Loading states
    isLoading: isPeopleLoading(),
    isInitialLoading: people.length === 0 && isPeopleLoading(),
    isRefreshing: people.length > 0 && isPeopleLoading(),

    // Error state
    error: getPeopleError(),

    // Actions
    refresh,
    invalidate,

    // Metadata
    lastFetched: peopleMetadata.lastFetched,
    isStale: isPeopleStale(),
    isOnline,
  }
}

/**
 * Hook for accessing people data with a simpler API
 * Returns just the people array and loading state
 */
export function usePeople() {
  const { people, isLoading, error } = usePeopleCache()

  return {
    people,
    isLoading,
    error,
  }
}

/**
 * Hook for accessing people data optimized for select components
 * Returns simplified person objects with just id, name, email, role, avatar
 */
export function usePeopleForSelect() {
  const { people, isLoading, error } = usePeopleCache()

  const selectPeople = people.map(person => ({
    id: person.id,
    name: person.name,
    email: person.email,
    role: person.role,
    avatar: person.avatar,
  }))

  return {
    people: selectPeople,
    isLoading,
    error,
  }
}
