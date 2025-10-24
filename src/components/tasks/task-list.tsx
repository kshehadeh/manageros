'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { Checkbox } from '@/components/ui/checkbox'
import { ListTodo, Eye, MoreHorizontal, Plus } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  QuickTaskForm,
  type QuickTaskFormRef,
} from '@/components/tasks/quick-task-form'
import { useRef } from 'react'

export interface Task {
  id: string
  title: string
  description?: string | null
  assigneeId?: string | null
  assignee?: {
    id: string
    name: string
  } | null
  dueDate?: Date | null
  priority: number
  status: string
  initiative?: {
    id?: string
    title: string
  } | null
  objective?: {
    id: string
    title: string
  } | null
  createdBy?: {
    id: string
    name: string
  } | null
}

export interface TaskListProps {
  tasks: Task[]
  title?: string
  variant?: 'compact' | 'full'
  showAddButton?: boolean
  initiativeId?: string
  viewAllHref?: string
  viewAllLabel?: string
  emptyStateText?: string
  onTaskUpdate?: () => void
  className?: string
  immutableFilters?: Record<string, unknown>
}

export function TaskList({
  tasks,
  title = 'Tasks',
  variant = 'compact',
  showAddButton = false,
  initiativeId,
  viewAllHref,
  viewAllLabel = 'View All',
  emptyStateText = 'No tasks found.',
  onTaskUpdate,
  className = '',
  immutableFilters,
}: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const quickTaskFormRef = useRef<QuickTaskFormRef>(null)

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

    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const isCurrentlyCompleted =
      completedTasks.has(taskId) || task.status === TASK_STATUS.DONE
    const newStatus = isCurrentlyCompleted ? TASK_STATUS.TODO : TASK_STATUS.DONE

    // Immediately add to processing state for visual feedback
    setProcessingTasks(prev => new Set(prev).add(taskId))

    try {
      await updateTaskStatus(taskId, newStatus)

      // Update completed tasks set based on new status
      setCompletedTasks(prev => {
        const newSet = new Set(prev)
        if (newStatus === TASK_STATUS.DONE) {
          newSet.add(taskId)
        } else {
          newSet.delete(taskId)
        }
        return newSet
      })

      // Remove from processing state
      setProcessingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })

      toast.success(
        `Task marked as ${newStatus === TASK_STATUS.DONE ? 'completed' : 'incomplete'}!`
      )
      onTaskUpdate?.()
    } catch (error) {
      console.error('Error updating task status:', error)
      // Remove from processing state on error
      setProcessingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
      toast.error('Failed to update task status')
    }
  }

  const handleTaskUpdate = () => {
    onTaskUpdate?.()
  }

  const handleDeleteTask = async () => {
    if (!deleteTargetId) return

    try {
      await deleteTask(deleteTargetId)
      toast.success('Task deleted successfully')
      onTaskUpdate?.()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const handleTaskCreated = () => {
    setIsAddModalOpen(false)
    onTaskUpdate?.()
  }

  const refetch = () => {
    onTaskUpdate?.()
  }

  // Filter tasks based on immutable filters
  const filterTasks = (tasksToFilter: Task[]) => {
    if (!immutableFilters || Object.keys(immutableFilters).length === 0) {
      return tasksToFilter
    }

    return tasksToFilter.filter(task => {
      return Object.entries(immutableFilters).every(([key, value]) => {
        switch (key) {
          case 'initiativeId':
            return task.initiative?.id === value
          case 'assigneeId':
            return task.assigneeId === value
          case 'status':
            if (Array.isArray(value)) {
              return value.includes(task.status)
            }
            return task.status === value
          case 'priority':
            return task.priority === value
          case 'createdById':
            return task.createdBy?.id === value
          case 'objectiveId':
            return task.objective?.id === value
          default:
            // For any other filters, try to match against task properties
            return (task as unknown as Record<string, unknown>)[key] === value
        }
      })
    })
  }

  // Show all tasks, but mark completed ones visually and apply filters
  const visibleTasks = filterTasks(tasks)

  const renderTaskItem = (task: Task) => {
    const statusVariant = taskStatusUtils.getVariant(task.status as TaskStatus)
    const isCompleted =
      completedTasks.has(task.id) || task.status === TASK_STATUS.DONE
    const isProcessing = processingTasks.has(task.id)

    return (
      <div
        key={task.id}
        className={`flex items-center justify-between px-3 py-2 border rounded-lg hover:bg-muted/50 transition-colors ${
          isProcessing ? 'opacity-75' : ''
        }`}
      >
        <div
          onClick={() => handleTaskClick(task)}
          className='flex items-start gap-3 flex-1 min-w-0 cursor-pointer'
        >
          <Checkbox
            checked={isCompleted || isProcessing}
            onClick={e => handleTaskComplete(task.id, e)}
            className='shrink-0 mt-0.5'
            disabled={isProcessing}
          />
          <div className='flex-1 min-w-0'>
            <h3
              className={`font-medium text-sm truncate mb-1 ${
                isCompleted || isProcessing
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
              {task.initiative && variant === 'compact' && (
                <>
                  <span className='truncate'>{task.initiative.title}</span>
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
  }

  const renderSectionHeader = () => {
    const actions = []

    if (viewAllHref) {
      actions.push(
        <Button asChild variant='outline' size='sm' key='view-all'>
          <Link href={viewAllHref} className='flex items-center gap-2'>
            <Eye className='w-4 h-4' />
            {viewAllLabel}
          </Link>
        </Button>
      )
    }

    if (showAddButton && initiativeId) {
      actions.push(
        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant='outline'
          size='sm'
          key='add-task'
        >
          <Plus className='h-4 w-4 mr-2' />
          Add Task
        </Button>
      )
    }

    return (
      <SectionHeader
        icon={ListTodo}
        title={title}
        action={actions.length > 0 ? actions : undefined}
      />
    )
  }

  return (
    <>
      <section className={`rounded-xl py-4 -mx-3 px-3 space-y-4 ${className}`}>
        {renderSectionHeader()}

        <div className='space-y-3'>
          {visibleTasks.length === 0 ? (
            <div className='text-neutral-400 text-sm'>{emptyStateText}</div>
          ) : (
            visibleTasks.map(renderTaskItem)
          )}
        </div>
      </section>

      {/* Task Quick Edit Dialog */}
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

      {/* Add Task Dialog */}
      {showAddButton && initiativeId && (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task to Initiative</DialogTitle>
            </DialogHeader>
            <QuickTaskForm
              ref={quickTaskFormRef}
              onSuccess={handleTaskCreated}
              initiativeId={initiativeId}
            />
          </DialogContent>
        </Dialog>
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
