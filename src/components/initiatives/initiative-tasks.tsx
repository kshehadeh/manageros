'use client'

import { useState } from 'react'
import { SimpleTaskList, type Task } from '@/components/tasks/task-list'
import { getTasksForInitiative } from '@/lib/actions/task'

interface InitiativeTasksProps {
  initiativeId: string
  tasks: Task[]
  objectives: Array<{
    id: string
    title: string
    keyResult: string | null
    sortIndex: number
  }>
}

export function InitiativeTasks({
  initiativeId,
  tasks: initialTasks,
}: InitiativeTasksProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  const handleTaskUpdate = async () => {
    try {
      // Fetch updated tasks for this initiative
      const updatedTasks = await getTasksForInitiative(initiativeId)
      setTasks(updatedTasks)
    } catch (error) {
      console.error('Error fetching updated tasks:', error)
      // Fallback to page reload if API fails
      window.location.reload()
    }
  }

  return (
    <SimpleTaskList
      tasks={tasks}
      title='Tasks'
      variant='full'
      showAddButton={true}
      initiativeId={initiativeId}
      emptyStateText='No tasks found for this initiative.'
      onTaskUpdate={handleTaskUpdate}
      immutableFilters={{ initiativeId }}
    />
  )
}
