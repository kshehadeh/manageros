'use client'

import { SimpleTaskList, type Task } from '@/components/tasks/task-list'

interface DashboardAssignedTasksClientSectionProps {
  tasks: Task[]
  personId: string
}

export function DashboardAssignedTasksClientSection({
  tasks,
  personId,
}: DashboardAssignedTasksClientSectionProps) {
  const handleTaskUpdate = () => {
    // Refresh the page to show updated data
    window.location.reload()
  }

  return (
    <SimpleTaskList
      tasks={tasks}
      title='Assigned Tasks'
      variant='compact'
      viewAllHref='/my-tasks'
      viewAllLabel='My Tasks'
      emptyStateText='No active tasks assigned to you.'
      onTaskUpdate={handleTaskUpdate}
      immutableFilters={{
        assigneeId: personId,
        status: ['todo', 'doing', 'blocked'],
      }}
    />
  )
}
