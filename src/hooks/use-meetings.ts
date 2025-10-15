import { useState, useEffect, useCallback } from 'react'
import type { UpcomingMeeting } from '@/components/meetings/shared-meetings-table'

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface MeetingsResponse {
  meetings: UpcomingMeeting[]
  pagination: PaginationInfo
}

interface MeetingFilters {
  scheduledFrom?: string
  scheduledTo?: string
  search?: string
  teamId?: string
  initiativeId?: string
  [key: string]: string | undefined
}

interface UseMeetingsOptions {
  page?: number
  limit?: number
  filters?: MeetingFilters
  immutableFilters?: MeetingFilters
  sort?: string
  enabled?: boolean
}

export function useMeetings({
  page = 1,
  limit = 20,
  filters,
  immutableFilters,
  sort,
  enabled = true,
}: UseMeetingsOptions = {}) {
  const [data, setData] = useState<MeetingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMeetings = useCallback(async () => {
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

      // Add sort parameter
      if (sort) {
        searchParams.set('sort', sort)
      }

      // Add immutable filters as JSON-encoded parameter
      if (Object.keys(immutableFilters || {}).length > 0) {
        searchParams.set('immutableFilters', JSON.stringify(immutableFilters))
      }

      const response = await fetch(`/api/meetings?${searchParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch meetings')
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
    fetchMeetings()
  }, [fetchMeetings])

  const refetch = useCallback(() => {
    fetchMeetings()
  }, [fetchMeetings])

  return {
    data,
    loading,
    error,
    refetch,
  }
}
