'use client'

import { useState, useEffect, useCallback } from 'react'
import { TaskTable } from '@/components/task-table'
import { TasksFilterBar } from '@/components/tasks-filter-bar'
import { Task, Person, Initiative, Objective, User } from '@prisma/client'

type TaskWithRelations = Task & {
  assignee: Person | null
  initiative: Initiative | null
  objective: Objective | null
  createdBy: User | null
}

interface TasksPageClientProps {
  tasks: TaskWithRelations[]
  people: Person[]
  initiatives: Initiative[]
}

export function TasksPageClient({
  tasks,
  people,
  initiatives,
}: TasksPageClientProps) {
  const [filteredTasks, setFilteredTasks] = useState<TaskWithRelations[]>(tasks)

  // Update filtered tasks when tasks prop changes
  useEffect(() => {
    setFilteredTasks(tasks)
  }, [tasks])

  const handleFilteredTasksChange = useCallback(
    (newFilteredTasks: TaskWithRelations[]) => {
      setFilteredTasks(newFilteredTasks)
    },
    []
  )

  return (
    <div className='space-y-4'>
      <TasksFilterBar
        tasks={tasks}
        people={people}
        initiatives={initiatives}
        onFilteredTasksChange={handleFilteredTasksChange}
      />

      <TaskTable
        tasks={filteredTasks}
        people={people}
        initiatives={initiatives}
        hideFilters={true}
      />
    </div>
  )
}
