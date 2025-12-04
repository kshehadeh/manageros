import { useState, useEffect, useCallback } from 'react'
import { NotificationWithResponse } from '@/lib/actions/notification'

interface NotificationFilters {
  search?: string
  type?: string
  status?: string
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface NotificationsResponse {
  notifications: NotificationWithResponse[]
  pagination: PaginationInfo
}

interface UseNotificationsTableOptions {
  page?: number
  limit?: number
  filters?: NotificationFilters
  immutableFilters?: NotificationFilters & {
    showAllOrganizationNotifications?: boolean
  }
  sort?: string
  enabled?: boolean
}

export function useNotificationsTable({
  page = 1,
  limit = 20,
  filters,
  immutableFilters,
  sort,
  enabled = true,
}: UseNotificationsTableOptions = {}) {
  const showAllOrganizationNotifications =
    immutableFilters?.showAllOrganizationNotifications || false
  const [data, setData] = useState<NotificationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
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
        showAll: showAllOrganizationNotifications.toString(),
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

      const response = await fetch(`/api/notifications/list?${searchParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch notifications')
      }

      const result = await response.json()
      // Transform to match GenericDataTable expected format
      setData({
        notifications: result.notifications,
        pagination: result.pagination,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [
    page,
    limit,
    filters,
    immutableFilters,
    sort,
    enabled,
    showAllOrganizationNotifications,
  ])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const refetch = useCallback(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const updateNotification = useCallback(
    (notificationId: string, updates: Partial<NotificationWithResponse>) => {
      setData(prevData => {
        if (!prevData) return prevData

        const updatedNotifications = prevData.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, ...updates }
            : notification
        )

        return { ...prevData, notifications: updatedNotifications }
      })
    },
    []
  )

  return {
    data,
    loading,
    error,
    refetch,
    updateNotification,
  }
}
