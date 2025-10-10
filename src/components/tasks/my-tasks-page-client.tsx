'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Person, Initiative } from '@prisma/client'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
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

  // Load completed tasks visibility setting for My Tasks
  useEffect(() => {
    if (isLoaded) {
      const hideCompleted = getSetting('myTasksHideCompleted')
      setFilters(prev => ({ ...prev, excludeCompleted: hideCompleted }))
    }
  }, [isLoaded, getSetting])

  const handleExcludeCompletedChange = useCallback(
    (excludeCompleted: boolean) => {
      setFilters(prev => ({ ...prev, excludeCompleted }))
      updateSetting('myTasksHideCompleted', excludeCompleted)
    },
    [updateSetting]
  )

  return (
    <GroupedTasksShared
      people={people}
      initiatives={initiatives}
      showOnlyMyTasks={true}
      settingsId='my-tasks'
      excludeCompleted={filters.excludeCompleted}
      onExcludeCompletedChange={handleExcludeCompletedChange}
    />
  )
}
