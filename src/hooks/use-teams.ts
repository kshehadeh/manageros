import { useState, useEffect, useCallback } from 'react'

export interface TeamListItem {
  id: string
  name: string
  description: string | null
  avatar: string | null
  parentId: string | null
  organizationId: string
  createdAt: Date
  updatedAt: Date
  parent: {
    id: string
    name: string | null
    avatar?: string | null
  } | null
  _count: {
    people: number
    initiatives: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface TeamsResponse {
  teams: TeamListItem[]
  pagination: PaginationInfo
}

interface TeamFilters {
  search?: string
  parentId?: string
  relatedToUser?: string
  [key: string]: string | undefined
}

interface UseTeamsOptions {
  page?: number
  limit?: number
  filters?: TeamFilters
  immutableFilters?: TeamFilters
  sort?: string
  enabled?: boolean
}

export function useTeams({
  page = 1,
  limit = 20,
  filters,
  immutableFilters,
  sort,
  enabled = true,
}: UseTeamsOptions = {}) {
  const [data, setData] = useState<TeamsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters || {}).filter(
            ([_, value]) => value !== undefined && value !== ''
          )
        ),
      })

      // Add sort parameter if provided
      if (sort) {
        searchParams.set('sort', sort)
      }

      // Add immutable filters as JSON-encoded parameter
      if (Object.keys(immutableFilters || {}).length > 0) {
        searchParams.set('immutableFilters', JSON.stringify(immutableFilters))
      }

      const response = await fetch(`/api/teams?${searchParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch teams')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, limit, filters, immutableFilters, sort, enabled])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const refetch = useCallback(() => {
    fetchTeams()
  }, [fetchTeams])

  const updateTeam = useCallback(
    (teamId: string, updates: Partial<TeamListItem>) => {
      setData(prevData => {
        if (!prevData) return prevData

        const updatedTeams = prevData.teams.map(team =>
          team.id === teamId ? { ...team, ...updates } : team
        )

        return { ...prevData, teams: updatedTeams }
      })
    },
    []
  )

  return {
    data,
    loading,
    error,
    refetch,
    updateTeam,
  }
}
