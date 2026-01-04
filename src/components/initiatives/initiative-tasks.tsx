'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SimpleTaskList, type Task } from '@/components/tasks/task-list'
import { getTasksForInitiative } from '@/lib/actions/task'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { ListTodo, Plus } from 'lucide-react'
import {
  TaskQuickEditDialog,
  type TaskQuickEditDialogRef,
} from '@/components/tasks/task-quick-edit-dialog'
import { cn } from '@/lib/utils'

interface InitiativeTasksClientProps {
  initiativeId: string
  tasks: Task[]
  canCreateTask?: boolean
}

export function InitiativeTasksClient({
  initiativeId,
  tasks: initialTasks,
  canCreateTask = false,
}: InitiativeTasksClientProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const taskDialogRef = useRef<TaskQuickEditDialogRef>(null)

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

  const handleTaskDialogOpen = () => {
    setShowTaskDialog(true)
    // Small delay to ensure the dialog is fully rendered before focusing
    setTimeout(() => {
      taskDialogRef.current?.focus()
    }, 100)
  }

  const handleTaskSuccess = () => {
    setShowTaskDialog(false)
    handleTaskUpdate()
    router.refresh()
  }

  return (
    <>
      <PageSection
        header={
          <SectionHeader
            icon={ListTodo}
            title='Tasks'
            action={
              canCreateTask ? (
                <button
                  onClick={handleTaskDialogOpen}
                  className={cn(
                    'inline-flex items-center gap-1 text-sm text-muted-foreground',
                    'hover:text-foreground transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'bg-transparent border-none p-0 cursor-pointer'
                  )}
                  title='Add Task'
                >
                  <Plus className='w-3.5 h-3.5' />
                  Add Task
                </button>
              ) : undefined
            }
          />
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

      <TaskQuickEditDialog
        ref={taskDialogRef}
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        initiativeId={initiativeId}
        onSuccess={handleTaskSuccess}
      />
    </>
  )
}
