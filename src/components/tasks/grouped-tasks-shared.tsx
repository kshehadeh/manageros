'use client'

import { useState, useEffect } from 'react'
import { TaskDataTable } from '@/components/tasks/data-table'
import type { TaskListItem } from '@/lib/task-list-select'
import type { Person, Initiative } from '@prisma/client'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { GroupingState } from '@tanstack/react-table'

type GroupingOption = 'status' | 'initiative' | 'assignee' | 'none'

interface GroupedTasksSharedProps {
  people: Person[]
  initiatives: Initiative[]
  showOnlyMyTasks?: boolean
  excludeCompleted?: boolean
  onExcludeCompletedChange?: (_exclude: boolean) => void
  fetchTasks?: () => Promise<TaskListItem[]>
}

export function GroupedTasksShared({
  people,
  initiatives,
  showOnlyMyTasks = false,
}: GroupedTasksSharedProps) {
  const { getSetting, isLoaded } = useUserSettings()
  const [groupingOption, setGroupingOption] = useState<GroupingOption>('status')

  // Load user settings when available
  useEffect(() => {
    if (isLoaded) {
      const savedGrouping = getSetting('taskGrouping') as GroupingOption
      setGroupingOption(savedGrouping)
    }
  }, [isLoaded, getSetting])

  // Convert grouping option to Tanstack Table grouping state
  const grouping: GroupingState =
    groupingOption === 'none' ? [] : [groupingOption]

  return (
    <div className='space-y-6'>
      {/* Task Data Table */}
      <TaskDataTable
        people={people}
        initiatives={initiatives}
        grouping={grouping}
        hideFilters={showOnlyMyTasks}
        enablePagination={true}
        limit={50}
      />
    </div>
  )
}
