'use client'

import { useState } from 'react'
import { Link } from '@/components/ui/link'
import {
  Edit,
  Target,
  Building2,
  Trash2,
  CheckCircle,
  Circle,
} from 'lucide-react'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { DeleteModal } from '@/components/common/delete-modal'
import { deleteTask, updateTaskStatus } from '@/lib/actions/task'
import { TASK_STATUS, type TaskStatus } from '@/lib/task-status'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface TaskActionsDropdownProps {
  taskId: string
  task: {
    id: string
    title: string
    status: TaskStatus
    assignee?: { id: string; name: string } | null
    initiative?: { id: string; title: string } | null
    team?: { id: string; name: string } | null
  }
  size?: 'sm' | 'default'
}

export function TaskActionsDropdown({
  taskId,
  task,
  size = 'default',
}: TaskActionsDropdownProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteTask(taskId)
      toast.success('Task deleted successfully')
      router.push('/tasks')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete task'
      )
    }
  }

  const handleStatusToggle = async () => {
    if (isUpdatingStatus) return

    setIsUpdatingStatus(true)
    try {
      const newStatus =
        task.status === TASK_STATUS.DONE ? TASK_STATUS.TODO : TASK_STATUS.DONE
      await updateTaskStatus(taskId, newStatus)
      toast.success(
        `Task ${newStatus === TASK_STATUS.DONE ? 'completed' : 'marked as incomplete'}`
      )
      router.refresh()
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update task status'
      )
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const isCompleted = task.status === TASK_STATUS.DONE

  return (
    <>
      <ActionDropdown size={size}>
        {({ close }) => (
          <div className='py-1'>
            <button
              className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
              onClick={event => {
                event.stopPropagation()
                close()
                handleStatusToggle()
              }}
              disabled={isUpdatingStatus}
            >
              {isCompleted ? (
                <Circle className='w-4 h-4' />
              ) : (
                <CheckCircle className='w-4 h-4' />
              )}
              {isUpdatingStatus
                ? 'Updating...'
                : isCompleted
                  ? 'Mark Incomplete'
                  : 'Mark Complete'}
            </button>

            <Link
              href={`/tasks/${taskId}/edit`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <Edit className='w-4 h-4' />
              Edit Task
            </Link>

            {task.initiative && (
              <Link
                href={`/initiatives/${task.initiative.id}`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={close}
              >
                <Target className='w-4 h-4' />
                View Initiative
              </Link>
            )}

            {task.team && (
              <Link
                href={`/teams/${task.team.id}`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={close}
              >
                <Building2 className='w-4 h-4' />
                View Team
              </Link>
            )}

            <div className='border-t border-border my-1' />

            <button
              className='flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-left'
              onClick={event => {
                event.stopPropagation()
                close()
                setShowDeleteModal(true)
              }}
            >
              <Trash2 className='w-4 h-4' />
              Delete Task
            </button>
          </div>
        )}
      </ActionDropdown>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Delete Task'
        entityName='task'
      />
    </>
  )
}
