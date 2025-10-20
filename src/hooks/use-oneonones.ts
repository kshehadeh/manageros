import { useState, useEffect, useCallback } from 'react'

export interface OneOnOneListItem {
  id: string
  managerId: string
  reportId: string
  scheduledAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  manager: {
    id: string
    name: string
    email: string | null
    user: {
      id: string
    } | null
  }
  report: {
    id: string
    name: string
    email: string | null
    user: {
      id: string
    } | null
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

interface OneOnOnesResponse {
  oneonones: OneOnOneListItem[]
  pagination: PaginationInfo
}

interface OneOnOneFilters {
  scheduledFrom?: string
  scheduledTo?: string
  [key: string]: string | undefined
}

interface UseOneOnOnesOptions {
  page?: number
  limit?: number
  filters?: OneOnOneFilters
  immutableFilters?: OneOnOneFilters
  sort?: string
  enabled?: boolean
}

export function useOneOnOnes({
  page = 1,
  limit = 20,
  filters,
  immutableFilters,
  sort,
  enabled = true,
}: UseOneOnOnesOptions = {}) {
  const [data, setData] = useState<OneOnOnesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOneOnOnes = useCallback(async () => {
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

      const response = await fetch(`/api/oneonones?${searchParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch one-on-ones')
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
    fetchOneOnOnes()
  }, [fetchOneOnOnes])

  const refetch = useCallback(() => {
    fetchOneOnOnes()
  }, [fetchOneOnOnes])

  const updateOneOnOne = useCallback(
    (oneOnOneId: string, updates: Partial<OneOnOneListItem>) => {
      setData(prevData => {
        if (!prevData) return prevData

        const updatedOneOnOnes = prevData.oneonones.map(oneOnOne =>
          oneOnOne.id === oneOnOneId ? { ...oneOnOne, ...updates } : oneOnOne
        )

        return { ...prevData, oneonones: updatedOneOnOnes }
      })
    },
    []
  )

  return {
    data,
    loading,
    error,
    refetch,
    updateOneOnOne,
  }
}
