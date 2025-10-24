'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { Checkbox } from '@/components/ui/checkbox'
import { ListTodo, Eye, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { TaskQuickEditDialog } from '@/components/tasks/task-quick-edit-dialog'
import { taskStatusUtils, TASK_STATUS } from '@/lib/task-status'
import type { TaskStatus } from '@/lib/task-status'
import { formatDistanceToNow } from 'date-fns'
import { updateTaskStatus, deleteTask } from '@/lib/actions/task'
import { toast } from 'sonner'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import {
  ViewDetailsMenuItem,
  EditMenuItem,
  MarkAsDoneMenuItem,
  DeleteMenuItem,
} from '@/components/common/context-menu-items'
import { DeleteModal } from '@/components/common/delete-modal'

interface Task {
  id: string
  title: string
  description?: string | null
  assigneeId?: string | null
  dueDate?: Date | null
  priority: number
  status: string // Changed from TaskStatus to string to match Prisma
  initiative?: {
    title: string
  } | null
}

interface DashboardAssignedTasksClientSectionProps {
  tasks: Task[]
}

export function DashboardAssignedTasksClientSection({
  tasks,
}: DashboardAssignedTasksClientSectionProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  // Open dialog after selectedTask has been updated
  useEffect(() => {
    if (selectedTask) {
      setIsDialogOpen(true)
    }
  }, [selectedTask])

  // Reset selectedTask when dialog is closed
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setSelectedTask(null)
    }
  }

  const handleTaskComplete = async (
    taskId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation() // Prevent opening the dialog

    // Immediately add to processing state for visual feedback
    setProcessingTasks(prev => new Set(prev).add(taskId))

    try {
      await updateTaskStatus(taskId, TASK_STATUS.DONE)
      // Move from processing to completed
      setProcessingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
      setCompletedTasks(prev => new Set(prev).add(taskId))
      toast.success('Task marked as completed!')
    } catch (error) {
      console.error('Error completing task:', error)
      // Remove from processing state on error
      setProcessingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
      toast.error('Failed to complete task')
    }
  }

  const handleTaskUpdate = () => {
    // Refresh the page to show updated data
    window.location.reload()
  }

  const handleDeleteTask = async () => {
    if (!deleteTargetId) return

    try {
      await deleteTask(deleteTargetId)
      toast.success('Task deleted successfully')
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const refetch = () => {
    // Refresh the page to show updated data
    window.location.reload()
  }

  // Filter out completed tasks
  const visibleTasks = tasks.filter(task => !completedTasks.has(task.id))

  return (
    <>
      <section className='rounded-xl py-4 -mx-3 px-3 md:mx-0 md:px-4 space-y-4'>
        <SectionHeader
          icon={ListTodo}
          title='Assigned Tasks'
          action={
            <Button asChild variant='outline' size='sm'>
              <Link href='/my-tasks' className='flex items-center gap-2'>
                <Eye className='w-4 h-4' />
                My Tasks
              </Link>
            </Button>
          }
        />

        <div className='space-y-3'>
          {visibleTasks.length === 0 ? (
            <div className='text-neutral-400 text-sm'>
              No active tasks assigned to you.
            </div>
          ) : (
            visibleTasks.map(task => {
              const statusVariant = taskStatusUtils.getVariant(
                task.status as TaskStatus
              )

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between px-3 py-2 border rounded-lg hover:bg-muted/50 transition-colors ${
                    processingTasks.has(task.id) ? 'opacity-75' : ''
                  }`}
                >
                  <div
                    onClick={() => handleTaskClick(task)}
                    className='flex items-start gap-3 flex-1 min-w-0 cursor-pointer'
                  >
                    <Checkbox
                      checked={
                        processingTasks.has(task.id) ||
                        completedTasks.has(task.id)
                      }
                      onClick={e => handleTaskComplete(task.id, e)}
                      className='shrink-0 mt-0.5'
                      disabled={processingTasks.has(task.id)}
                    />
                    <div className='flex-1 min-w-0'>
                      <h3
                        className={`font-medium text-sm truncate mb-1 ${
                          processingTasks.has(task.id) ||
                          completedTasks.has(task.id)
                            ? 'line-through text-muted-foreground'
                            : ''
                        }`}
                      >
                        {task.title}
                      </h3>

                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <Badge variant={statusVariant} className='text-xs'>
                          {taskStatusUtils.getLabel(task.status as TaskStatus)}
                        </Badge>
                        {task.initiative && (
                          <>
                            <span className='truncate'>
                              {task.initiative.title}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        {task.dueDate && (
                          <span>
                            Due{' '}
                            {formatDistanceToNow(task.dueDate, {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0 hover:bg-muted shrink-0'
                    onClick={e => handleButtonClick(e, task.id)}
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </section>

      {selectedTask && (
        <TaskQuickEditDialog
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          task={{
            ...selectedTask,
            status: selectedTask.status as TaskStatus,
          }}
          onTaskUpdate={handleTaskUpdate}
        />
      )}

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => {
          const task = tasks.find(t => t.id === entityId)
          if (!task) return null

          return (
            <>
              <ViewDetailsMenuItem
                entityId={entityId}
                entityType='tasks'
                close={close}
              />
              <EditMenuItem
                entityId={entityId}
                entityType='tasks'
                close={close}
              />
              <MarkAsDoneMenuItem
                taskId={entityId}
                currentStatus={task.status}
                close={close}
                onSuccess={refetch}
              />
              <DeleteMenuItem
                onDelete={() => {
                  setDeleteTargetId(entityId)
                  setShowDeleteModal(true)
                }}
                close={close}
              />
            </>
          )
        }}
      </ContextMenuComponent>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTargetId(null)
        }}
        onConfirm={handleDeleteTask}
        title='Delete Task'
        entityName='task'
      />
    </>
  )
}
