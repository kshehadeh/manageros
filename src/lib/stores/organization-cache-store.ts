'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getPeople as fetchPeopleFromServer } from '@/lib/actions/person'

// Types for cached data
export interface CachedPerson {
  id: string
  name: string
  email?: string | null
  role?: string | null
  avatar?: string | null
  status: string
  organizationId: string
  jobRole?: {
    id: string
    title: string
    level?: {
      id: string
      name: string
      order: number
    }
    domain?: {
      id: string
      name: string
    }
  } | null
  team?: {
    id: string
    name: string
  } | null
  manager?: {
    id: string
    name: string
    email?: string | null
  } | null
  reports?: Array<{
    id: string
    name: string
    email?: string | null
  }>
  user?: {
    id: string
    email: string
  } | null
}

interface CacheMetadata {
  lastFetched: Date | null
  isFetching: boolean
  error: string | null
}

interface OrganizationCacheState {
  // People cache
  people: CachedPerson[]
  peopleMetadata: CacheMetadata

  // Actions
  fetchPeople: () => Promise<void>
  invalidatePeople: () => void
  getPeople: () => CachedPerson[]
  isPeopleStale: () => boolean
  isPeopleLoading: () => boolean
  getPeopleError: () => string | null

  // Future: teams, initiatives, etc.
  // teams: CachedTeam[]
  // teamsMetadata: CacheMetadata
  // fetchTeams: () => Promise<void>
  // ...
}

// Cache staleness threshold (2 minutes - more aggressive since we can't invalidate directly)
const STALE_THRESHOLD_MS = 2 * 60 * 1000

export const useOrganizationCacheStore = create<OrganizationCacheState>()(
  devtools(
    (set, get) => ({
      // Initial state
      people: [],
      peopleMetadata: {
        lastFetched: null,
        isFetching: false,
        error: null,
      },

      // People cache actions
      fetchPeople: async () => {
        const state = get()

        // Don't fetch if already fetching
        if (state.peopleMetadata.isFetching) {
          return
        }

        set(state => ({
          peopleMetadata: {
            ...state.peopleMetadata,
            isFetching: true,
            error: null,
          },
        }))

        try {
          const peopleData = await fetchPeopleFromServer()

          set({
            people: peopleData,
            peopleMetadata: {
              lastFetched: new Date(),
              isFetching: false,
              error: null,
            },
          })
        } catch (error) {
          console.error('Error fetching people:', error)

          set(state => ({
            peopleMetadata: {
              ...state.peopleMetadata,
              isFetching: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch people',
            },
          }))
        }
      },

      invalidatePeople: () => {
        set({
          peopleMetadata: {
            lastFetched: null,
            isFetching: false,
            error: null,
          },
        })
      },

      getPeople: () => {
        return get().people
      },

      isPeopleStale: () => {
        const { peopleMetadata } = get()

        if (!peopleMetadata.lastFetched) {
          return true // Never fetched
        }

        const now = new Date()
        const timeSinceLastFetch =
          now.getTime() - peopleMetadata.lastFetched.getTime()

        return timeSinceLastFetch > STALE_THRESHOLD_MS
      },

      isPeopleLoading: () => {
        return get().peopleMetadata.isFetching
      },

      getPeopleError: () => {
        return get().peopleMetadata.error
      },
    }),
    {
      name: 'organization-cache-store',
    }
  )
)

// Export convenience functions for direct access
export const {
  fetchPeople,
  invalidatePeople,
  getPeople: getCachedPeople,
  isPeopleStale,
  isPeopleLoading,
  getPeopleError,
} = useOrganizationCacheStore.getState()
