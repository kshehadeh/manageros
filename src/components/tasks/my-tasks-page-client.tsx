'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Person, Initiative } from '@prisma/client'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { useMyTasks } from '@/hooks/use-my-tasks'
import { GroupedTasksShared } from './grouped-tasks-shared'

interface MyTasksPageClientProps {
  people: Person[]
  initiatives: Initiative[]
}

export function MyTasksPageClient({
  people,
  initiatives,
}: MyTasksPageClientProps) {
  const { getSetting, updateSetting, isLoaded } = useUserSettings()
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    assigneeId: '',
    initiativeId: '',
    priority: '',
    dueDateFrom: '',
    dueDateTo: '',
    excludeCompleted: false,
  })

  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Memoize the filters object to prevent unnecessary re-renders
  const memoizedFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [filters, debouncedSearch]
  )

  // Load completed tasks visibility setting for My Tasks
  useEffect(() => {
    if (isLoaded) {
      const hideCompleted = getSetting('myTasksHideCompleted')
      setFilters(prev => ({ ...prev, excludeCompleted: hideCompleted }))
    }
  }, [isLoaded, getSetting])

  const {
    data: tasksData,
    loading,
    error,
    refetch,
  } = useMyTasks({
    page: currentPage,
    limit: 20,
    filters: memoizedFilters,
    enabled: isLoaded,
  })

  const tasks = tasksData?.tasks || []
  const pagination = tasksData?.pagination

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [filters.search])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, debouncedSearch])

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const handleExcludeCompletedChange = useCallback(
    (excludeCompleted: boolean) => {
      setFilters(prev => ({ ...prev, excludeCompleted }))
      updateSetting('myTasksHideCompleted', excludeCompleted)
    },
    [updateSetting]
  )

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  return (
    <GroupedTasksShared
      tasks={tasks}
      people={people}
      initiatives={initiatives}
      loading={loading}
      error={error}
      onRefetch={refetch}
      pagination={pagination}
      onPageChange={handlePageChange}
      showOnlyMyTasks={true}
      onSearchChange={handleSearchChange}
      searchValue={filters.search}
      excludeCompleted={filters.excludeCompleted}
      onExcludeCompletedChange={handleExcludeCompletedChange}
    />
  )
}
