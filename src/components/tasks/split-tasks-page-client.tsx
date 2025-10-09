'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { TaskTable } from '@/components/tasks/task-table'
import { LegacyTasksFilterBar } from '@/components/tasks/tasks-filter-bar'
import type { TaskListItem } from '@/lib/task-list-select'
import type { Person, Initiative } from '@prisma/client'
import {
  ACTIVE_STATUSES,
  COMPLETED_STATUSES,
  TaskStatus,
} from '@/lib/task-status'

interface SplitTasksPageClientProps {
  tasks: TaskListItem[]
  people: Person[]
  initiatives: Initiative[]
}

export function SplitTasksPageClient({
  tasks,
  people,
  initiatives,
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
        initiatives={initiatives}
        onFilteredTasksChange={handleFilteredTasksChange}
      />

      {/* Incomplete Tasks Section */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between px-0'>
          <h3 className='text-lg font-semibold'>
            Incomplete Tasks ({incompleteTasks.length})
          </h3>
        </div>
        <TaskTable
          tasks={incompleteTasks}
          people={people}
          initiatives={initiatives}
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
          <TaskTable
            tasks={completedTasks}
            people={people}
            initiatives={initiatives}
            hideFilters={true}
          />
        </div>
      )}
    </div>
  )
}
