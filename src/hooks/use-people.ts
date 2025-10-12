import { useState, useEffect, useCallback } from 'react'

export interface PersonListItem {
  id: string
  name: string
  email: string | null
  role: string | null
  status: string
  avatarUrl: string | null
  startDate: Date | null
  endDate: Date | null
  teamId: string | null
  managerId: string | null
  jobRoleId: string | null
  organizationId: string
  userId: string | null
  createdAt: Date
  updatedAt: Date
  teamName: string | null
  managerName: string | null
  jobRoleTitle: string | null
  reportCount: number
}

interface PeopleFilters {
  search?: string
  teamId?: string
  managerId?: string
  jobRoleId?: string
  status?: string
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}

interface PeopleResponse {
  people: PersonListItem[]
  pagination: PaginationInfo
}

interface UsePeopleOptions {
  page?: number
  limit?: number
  filters?: PeopleFilters
  immutableFilters?: PeopleFilters
  sort?: string
  enabled?: boolean
}

export function usePeople({
  page = 1,
  limit = 20,
  filters,
  immutableFilters,
  sort,
  enabled = true,
}: UsePeopleOptions = {}) {
  const [data, setData] = useState<PeopleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPeople = useCallback(async () => {
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

      const response = await fetch(`/api/people?${searchParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch people')
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
    fetchPeople()
  }, [fetchPeople])

  const refetch = useCallback(() => {
    fetchPeople()
  }, [fetchPeople])

  const updatePerson = useCallback(
    (personId: string, updates: Partial<PersonListItem>) => {
      setData(prevData => {
        if (!prevData) return prevData

        const updatedPeople = prevData.people.map(person =>
          person.id === personId ? { ...person, ...updates } : person
        )

        return { ...prevData, people: updatedPeople }
      })
    },
    []
  )

  return {
    data,
    loading,
    error,
    refetch,
    updatePerson,
  }
}
