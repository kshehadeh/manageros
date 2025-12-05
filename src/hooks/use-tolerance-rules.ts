import { useState, useEffect, useCallback } from 'react'
import type { ToleranceRule } from '@/types/tolerance-rule'

interface ToleranceRulesResponse {
  tolerancerules: ToleranceRule[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

interface ToleranceRulesFilters {
  search?: string
  ruleType?: string
  isEnabled?: string
}

interface UseToleranceRulesOptions {
  page?: number
  limit?: number
  filters?: ToleranceRulesFilters
  immutableFilters?: ToleranceRulesFilters
  sort?: string
  enabled?: boolean
}

export function useToleranceRules({
  page = 1,
  limit = 20,
  filters,
  immutableFilters,
  sort,
  enabled = true,
}: UseToleranceRulesOptions = {}) {
  const [data, setData] = useState<ToleranceRulesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchToleranceRules = useCallback(async () => {
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
            ([_, value]) =>
              value !== undefined && value !== '' && value !== 'all'
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

      const response = await fetch(`/api/tolerance-rules?${searchParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch tolerance rules')
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
    fetchToleranceRules()
  }, [fetchToleranceRules])

  const refetch = useCallback(() => {
    fetchToleranceRules()
  }, [fetchToleranceRules])

  const updateToleranceRule = useCallback(
    (ruleId: string, updates: Partial<ToleranceRule>) => {
      setData(prevData => {
        if (!prevData) return prevData

        const updatedRules = prevData.tolerancerules.map(rule =>
          rule.id === ruleId ? { ...rule, ...updates } : rule
        )

        return { ...prevData, tolerancerules: updatedRules }
      })
    },
    []
  )

  return {
    data,
    loading,
    error,
    refetch,
    updateItem: updateToleranceRule,
  }
}
