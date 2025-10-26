import { useState, useEffect, useCallback } from 'react'

interface JobRole {
  id: string
  title: string
  description: string | null
  level: { id: string; name: string }
  domain: { id: string; name: string }
  people: Array<{ id: string; name: string }>
}

interface JobRolesResponse {
  jobRoles: JobRole[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

interface JobRolesFilters {
  search?: string
  levelId?: string
  domainId?: string
}

interface UseJobRolesOptions {
  page?: number
  limit?: number
  filters?: JobRolesFilters
  immutableFilters?: JobRolesFilters
  sort?: string
  enabled?: boolean
}

export function useJobRoles({
  page = 1,
  limit = 20,
  filters,
  immutableFilters,
  sort,
  enabled = true,
}: UseJobRolesOptions = {}) {
  const [data, setData] = useState<JobRolesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobRoles = useCallback(async () => {
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

      const response = await fetch(`/api/job-roles?${searchParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch job roles')
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
    fetchJobRoles()
  }, [fetchJobRoles])

  const refetch = useCallback(() => {
    fetchJobRoles()
  }, [fetchJobRoles])

  const updateJobRole = useCallback(
    (jobRoleId: string, updates: Partial<JobRole>) => {
      setData(prevData => {
        if (!prevData) return prevData

        const updatedJobRoles = prevData.jobRoles.map(jobRole =>
          jobRole.id === jobRoleId ? { ...jobRole, ...updates } : jobRole
        )

        return { ...prevData, jobRoles: updatedJobRoles }
      })
    },
    []
  )

  return {
    data,
    loading,
    error,
    refetch,
    updateItem: updateJobRole,
  }
}
