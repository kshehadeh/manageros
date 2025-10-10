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
}

export function GroupedTasksShared({
  people,
  initiatives,
  showOnlyMyTasks = false,
}: GroupedTasksSharedProps) {
  return (
    <div className='space-y-6'>
      {/* Task Data Table */}
      <TaskDataTable
        people={people}
        initiatives={initiatives}
        hideFilters={showOnlyMyTasks}
        showOnlyMyTasks={showOnlyMyTasks}
        enablePagination={true}
        limit={50}
      />
    </div>
  )
}
