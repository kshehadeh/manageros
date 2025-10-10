import { useState, useEffect, useCallback, useMemo } from 'react'
import type { TaskListItem } from '@/lib/task-list-select'

interface TaskFilters {
  search?: string
  status?: string
  assigneeId?: string
  initiativeId?: string
  priority?: string
  dueDateFrom?: string
  dueDateTo?: string
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

interface UseTasksOptions {
  page?: number
  limit?: number
  filters?: TaskFilters
  immutableFilters?: TaskFilters
}

export function useTasks({
  page = 1,
  limit = 20,
  filters = {},
  immutableFilters = {},
}: UseTasksOptions = {}) {
  const [data, setData] = useState<TasksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize filters to prevent infinite re-renders
  const memoizedFilters = useMemo(() => filters, [filters])

  const memoizedImmutableFilters = useMemo(
    () => immutableFilters,
    [immutableFilters]
  )

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(memoizedFilters).filter(
            ([_, value]) => value !== undefined && value !== ''
          )
        ),
      })

      // Add immutable filters as JSON-encoded parameter
      if (Object.keys(memoizedImmutableFilters).length > 0) {
        searchParams.set(
          'immutableFilters',
          JSON.stringify(memoizedImmutableFilters)
        )
      }

      const response = await fetch(`/api/tasks?${searchParams}`)

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
  }, [page, limit, memoizedFilters, memoizedImmutableFilters])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const refetch = useCallback(() => {
    fetchTasks()
  }, [fetchTasks])

  const updateTask = useCallback(
    (taskId: string, updates: Partial<TaskListItem>) => {
      setData(prevData => {
        if (!prevData) return prevData

        const updatedTasks = prevData.tasks.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )

        return { ...prevData, tasks: updatedTasks }
      })
    },
    []
  )

  return {
    data,
    loading,
    error,
    refetch,
    updateTask,
  }
}
