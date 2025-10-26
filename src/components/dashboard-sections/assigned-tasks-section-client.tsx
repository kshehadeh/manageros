'use client'

import { useRouter } from 'next/navigation'
import { SimpleTaskList, type Task } from '@/components/tasks/task-list'

interface DashboardAssignedTasksClientSectionProps {
  tasks: Task[]
  personId: string
}

export function DashboardAssignedTasksClientSection({
  tasks,
  personId,
}: DashboardAssignedTasksClientSectionProps) {
  const router = useRouter()

  const handleTaskUpdate = () => {
    // Refresh the server component data without a full page reload
    router.refresh()
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
