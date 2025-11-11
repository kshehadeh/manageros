'use client'

import { useState } from 'react'
import { SimpleTaskList, type Task } from '@/components/tasks/task-list'
import { getTasksForInitiative } from '@/lib/actions/task'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { ListTodo, Plus } from 'lucide-react'
import { TaskQuickEditDialog } from '@/components/tasks/task-quick-edit-dialog'

interface InitiativeTasksClientProps {
  initiativeId: string
  tasks: Task[]
  canEdit?: boolean
}

export function InitiativeTasksClient({
  initiativeId,
  tasks: initialTasks,
  canEdit = false,
}: InitiativeTasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

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

  const handleTaskCreated = () => {
    setIsAddModalOpen(false)
    handleTaskUpdate()
  }

  const actions = canEdit
    ? [
        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant='outline'
          size='sm'
          key='add-task'
        >
          <Plus className='h-4 w-4 mr-2' />
          Add Task
        </Button>,
      ]
    : undefined

  return (
    <>
      <PageSection
        header={
          <SectionHeader icon={ListTodo} title='Tasks' action={actions} />
        }
      >
        <SimpleTaskList
          tasks={tasks}
          variant='full'
          emptyStateText='No tasks found for this initiative.'
          onTaskUpdate={handleTaskUpdate}
          immutableFilters={{ initiativeId }}
        />
      </PageSection>

      {/* Add Task Dialog */}
      <TaskQuickEditDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        initiativeId={initiativeId}
        onSuccess={handleTaskCreated}
      />
    </>
  )
}
