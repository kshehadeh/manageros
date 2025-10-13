import { useState, useEffect, useCallback } from 'react'
import type { FeedbackResponse } from '@/types/api'

interface UseFeedbackOptions {
  page?: number
  limit?: number
  filters?: {
    search?: string
    fromPersonId?: string
    aboutPersonId?: string
    kind?: string
    isPrivate?: string
    startDate?: string
    endDate?: string
  }
  immutableFilters?: {
    search?: string
    fromPersonId?: string
    aboutPersonId?: string
    kind?: string
    isPrivate?: string
    startDate?: string
    endDate?: string
  }
  sort?: string
  enabled?: boolean
}

export function useFeedback(options: UseFeedbackOptions = {}) {
  const {
    page = 1,
    limit = 20,
    filters = {},
    immutableFilters = {},
    sort = '',
    enabled = true,
  } = options

  const [data, setData] = useState<FeedbackResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeedback = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', String(limit))

      // Add filters
      if (filters.search) params.append('search', filters.search)
      if (filters.fromPersonId)
        params.append('fromPersonId', filters.fromPersonId)
      if (filters.aboutPersonId)
        params.append('aboutPersonId', filters.aboutPersonId)
      if (filters.kind) params.append('kind', filters.kind)
      if (filters.isPrivate) params.append('isPrivate', filters.isPrivate)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      // Add immutable filters as JSON
      if (Object.keys(immutableFilters).length > 0) {
        params.append('immutableFilters', JSON.stringify(immutableFilters))
      }

      // Add sort
      if (sort) params.append('sort', sort)

      const response = await fetch(`/api/feedback?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch feedback')
      }

      const data = await response.json()
      setData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, limit, filters, immutableFilters, sort, enabled])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  return {
    data,
    loading,
    error,
    refetch: fetchFeedback,
  }
}
