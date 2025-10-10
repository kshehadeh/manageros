'use client'

import { TaskDataTable } from '@/components/tasks/data-table'
import type { TaskListItem } from '@/lib/task-list-select'
import type { Person, Initiative } from '@prisma/client'

interface GroupedTasksSharedProps {
  people: Person[]
  initiatives: Initiative[]
  showOnlyMyTasks?: boolean
  excludeCompleted?: boolean
  onExcludeCompletedChange?: (_exclude: boolean) => void
  fetchTasks?: () => Promise<TaskListItem[]>
  settingsId?: string
}

export function GroupedTasksShared({
  people,
  initiatives,
  showOnlyMyTasks = false,
  settingsId,
}: GroupedTasksSharedProps) {
  return (
    <div className='space-y-6'>
      {/* Task Data Table */}
      <TaskDataTable
        people={people}
        initiatives={initiatives}
        hideFilters={false}
        showOnlyMyTasks={showOnlyMyTasks}
        settingsId={settingsId}
        enablePagination={true}
        limit={50}
      />
    </div>
  )
}
