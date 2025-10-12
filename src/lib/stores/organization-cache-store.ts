'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getTeams as fetchTeamsFromServer } from '@/lib/actions/team'
import type { PeopleResponse } from '@/types/api'

// Fetch all people from the API (used for cache)
async function fetchPeopleFromAPI() {
  const response = await fetch('/api/people?limit=10000&status=active')
  if (!response.ok) {
    throw new Error('Failed to fetch people')
  }
  const data = (await response.json()) as PeopleResponse
  return data.people
}

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

export interface CachedTeam {
  id: string
  name: string
  description?: string | null
  avatar?: string | null
  organizationId: string
  parentId?: string | null
  parent?: {
    id: string
    name: string
  } | null
  children?: Array<{
    id: string
    name: string
  }>
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

  // Teams cache
  teams: CachedTeam[]
  teamsMetadata: CacheMetadata

  // Actions
  fetchPeople: () => Promise<void>
  invalidatePeople: () => void
  getPeople: () => CachedPerson[]
  isPeopleStale: () => boolean
  isPeopleLoading: () => boolean
  getPeopleError: () => string | null

  fetchTeams: () => Promise<void>
  invalidateTeams: () => void
  getTeams: () => CachedTeam[]
  isTeamsStale: () => boolean
  isTeamsLoading: () => boolean
  getTeamsError: () => string | null

  // Future: initiatives, etc.
  // initiatives: CachedInitiative[]
  // initiativesMetadata: CacheMetadata
  // fetchInitiatives: () => Promise<void>
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

      teams: [],
      teamsMetadata: {
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
          const peopleData = await fetchPeopleFromAPI()

          // Transform API response to match CachedPerson format
          const transformedPeople = peopleData.map(person => ({
            id: person.id,
            name: person.name,
            email: person.email,
            role: person.role,
            avatar: person.avatarUrl,
            status: person.status,
            organizationId: person.organizationId,
            jobRole: person.jobRoleId
              ? {
                  id: person.jobRoleId,
                  title: person.jobRoleTitle || '',
                }
              : null,
            team: person.teamId
              ? {
                  id: person.teamId,
                  name: person.teamName || '',
                }
              : null,
            manager: person.managerId
              ? {
                  id: person.managerId,
                  name: person.managerName || '',
                }
              : null,
            reports: [],
          }))

          set({
            people: transformedPeople,
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

      // Teams cache actions
      fetchTeams: async () => {
        const state = get()

        // Don't fetch if already fetching
        if (state.teamsMetadata.isFetching) {
          return
        }

        set(state => ({
          teamsMetadata: {
            ...state.teamsMetadata,
            isFetching: true,
            error: null,
          },
        }))

        try {
          const teamsData = await fetchTeamsFromServer()

          set({
            teams: teamsData,
            teamsMetadata: {
              lastFetched: new Date(),
              isFetching: false,
              error: null,
            },
          })
        } catch (error) {
          console.error('Error fetching teams:', error)

          set(state => ({
            teamsMetadata: {
              ...state.teamsMetadata,
              isFetching: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch teams',
            },
          }))
        }
      },

      invalidateTeams: () => {
        set({
          teamsMetadata: {
            lastFetched: null,
            isFetching: false,
            error: null,
          },
        })
      },

      getTeams: () => {
        return get().teams
      },

      isTeamsStale: () => {
        const { teamsMetadata } = get()

        if (!teamsMetadata.lastFetched) {
          return true // Never fetched
        }

        const now = new Date()
        const timeSinceLastFetch =
          now.getTime() - teamsMetadata.lastFetched.getTime()

        return timeSinceLastFetch > STALE_THRESHOLD_MS
      },

      isTeamsLoading: () => {
        return get().teamsMetadata.isFetching
      },

      getTeamsError: () => {
        return get().teamsMetadata.error
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
  fetchTeams,
  invalidateTeams,
  getTeams: getCachedTeams,
  isTeamsStale,
  isTeamsLoading,
  getTeamsError,
} = useOrganizationCacheStore.getState()
