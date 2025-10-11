'use client'

import { useState, useEffect, useCallback } from 'react'
import { TaskDataTable } from '@/components/tasks/data-table'
import { LegacyTasksFilterBar } from '@/components/tasks/tasks-filter-bar'
import type { TaskListItem } from '@/lib/task-list-select'
import type { Person } from '@prisma/client'

interface TasksPageClientProps {
  tasks: TaskListItem[]
  people: Person[]
}

export function TasksPageClient({ tasks, people }: TasksPageClientProps) {
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

  return (
    <div className='space-y-4'>
      <LegacyTasksFilterBar
        tasks={tasks}
        people={people}
        onFilteredTasksChange={handleFilteredTasksChange}
      />

      <TaskDataTable tasks={filteredTasks} people={people} hideFilters={true} />
    </div>
  )
}
