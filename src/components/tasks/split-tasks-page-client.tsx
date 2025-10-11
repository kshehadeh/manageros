'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { TaskDataTable } from '@/components/tasks/data-table'
import { LegacyTasksFilterBar } from '@/components/tasks/tasks-filter-bar'
import type { TaskListItem } from '@/lib/task-list-select'
import type { Person } from '@prisma/client'
import {
  ACTIVE_STATUSES,
  COMPLETED_STATUSES,
  TaskStatus,
} from '@/lib/task-status'

interface SplitTasksPageClientProps {
  tasks: TaskListItem[]
  people: Person[]
}

export function SplitTasksPageClient({
  tasks,
  people,
}: SplitTasksPageClientProps) {
  const [filteredTasks, setFilteredTasks] = useState<TaskListItem[]>(tasks)

  // Update filtered tasks when tasks prop changes
  useEffect(() => {
    setFilteredTasks(tasks)
  }, [tasks])

  const handleFilteredTasksChange = useCallback(
    (newFilteredTasks: TaskListItem[]) => {
      setFilteredTasks(newFilteredTasks)
    },
    []
  )

  // Split tasks into incomplete and completed
  const { incompleteTasks, completedTasks } = useMemo(() => {
    const incomplete = filteredTasks.filter(task =>
      ACTIVE_STATUSES.includes(task.status as TaskStatus)
    )
    const completed = filteredTasks.filter(task =>
      COMPLETED_STATUSES.includes(task.status as TaskStatus)
    )

    // Sort incomplete tasks by due date (desc) then priority (desc)
    const sortedIncomplete = [...incomplete].sort((a, b) => {
      // First sort by due date (desc) - null dates go to end
      const aDueDate = a.dueDate
        ? new Date(a.dueDate).getTime()
        : Number.MAX_SAFE_INTEGER
      const bDueDate = b.dueDate
        ? new Date(b.dueDate).getTime()
        : Number.MAX_SAFE_INTEGER

      if (aDueDate !== bDueDate) {
        return bDueDate - aDueDate // desc order
      }

      // Then sort by priority (desc)
      return b.priority - a.priority
    })

    // Sort completed tasks by updatedAt (desc)
    const sortedCompleted = [...completed].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    return {
      incompleteTasks: sortedIncomplete,
      completedTasks: sortedCompleted,
    }
  }, [filteredTasks])

  return (
    <div className='space-y-6'>
      <LegacyTasksFilterBar
        tasks={tasks}
        people={people}
        onFilteredTasksChange={handleFilteredTasksChange}
      />

      {/* Incomplete Tasks Section */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between px-0'>
          <h3 className='text-lg font-semibold'>
            Incomplete Tasks ({incompleteTasks.length})
          </h3>
        </div>
        <TaskDataTable
          tasks={incompleteTasks}
          people={people}
          hideFilters={true}
        />
      </div>

      {/* Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between px-0'>
            <h3 className='text-lg font-semibold'>
              Recently Completed ({completedTasks.length})
            </h3>
          </div>
          <TaskDataTable
            tasks={completedTasks}
            people={people}
            hideFilters={true}
          />
        </div>
      )}
    </div>
  )
}
