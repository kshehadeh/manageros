import { useState, useEffect, useCallback } from 'react'
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
}

export function useTasks({
  page = 1,
  limit = 20,
  filters = {},
}: UseTasksOptions = {}) {
  const [data, setData] = useState<TasksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([_, value]) => value !== undefined && value !== ''
          )
        ),
      })

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
  }, [page, limit, filters])

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
