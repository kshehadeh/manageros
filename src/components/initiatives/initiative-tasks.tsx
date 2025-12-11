'use client'

import { useState } from 'react'
import { SimpleTaskList, type Task } from '@/components/tasks/task-list'
import { getTasksForInitiative } from '@/lib/actions/task'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { ListTodo } from 'lucide-react'

interface InitiativeTasksClientProps {
  initiativeId: string
  tasks: Task[]
}

export function InitiativeTasksClient({
  initiativeId,
  tasks: initialTasks,
}: InitiativeTasksClientProps) {
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
    <PageSection header={<SectionHeader icon={ListTodo} title='Tasks' />}>
      <SimpleTaskList
        tasks={tasks}
        variant='full'
        emptyStateText='No tasks found for this initiative.'
        onTaskUpdate={handleTaskUpdate}
        immutableFilters={{ initiativeId }}
      />
    </PageSection>
  )
}
