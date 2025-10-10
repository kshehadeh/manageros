import { useState, useEffect, useCallback, useMemo } from 'react'
import type { TaskListItem } from '@/lib/task-list-select'

interface TaskFilters {
  search?: string
  status?: string
  initiativeId?: string
  priority?: string
  dueDateFrom?: string
  dueDateTo?: string
  excludeCompleted?: boolean
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface TasksResponse {
  tasks: TaskListItem[]
  pagination: PaginationInfo
}

interface UseMyTasksOptions {
  page?: number
  limit?: number
  filters?: TaskFilters
  enabled?: boolean
}

export function useMyTasks({
  page = 1,
  limit = 20,
  filters = {},
  enabled = true,
}: UseMyTasksOptions = {}) {
  const [data, setData] = useState<TasksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize filters to prevent infinite re-renders
  const memoizedFilters = useMemo(
    () => filters,
    [
      filters.search,
      filters.status,
      filters.initiativeId,
      filters.priority,
      filters.dueDateFrom,
      filters.dueDateTo,
      filters.excludeCompleted,
    ]
  )

  const fetchTasks = useCallback(async () => {
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
          Object.entries(memoizedFilters).filter(
            ([_, value]) =>
              value !== undefined && value !== '' && value !== false
          )
        ),
      })

      const response = await fetch(`/api/tasks/my-tasks?${searchParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch tasks')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, limit, memoizedFilters, enabled])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const refetch = useCallback(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    data,
    loading,
    error,
    refetch,
  }
}
