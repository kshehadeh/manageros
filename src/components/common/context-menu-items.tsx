'use client'

import { Eye, Edit, Trash2, Check, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import { toast } from 'sonner'
import { updateTaskStatus, updateTaskDueDate } from '@/lib/actions/task'
import { TASK_STATUS } from '@/lib/task-status'
import { Separator } from '@/components/ui/separator'

interface ContextMenuItemProps {
  onClick: () => void
  icon?: ReactNode
  children: ReactNode
  variant?: 'default' | 'destructive'
  className?: string
}

export function ContextMenuItem({
  onClick,
  icon,
  children,
  variant = 'default',
  className = '',
}: ContextMenuItemProps) {
  const baseClass =
    'w-full px-lg py-md text-sm hover:bg-accent flex items-center gap-md text-left transition-colors'
  const variantClass =
    variant === 'destructive'
      ? 'text-destructive hover:bg-destructive/10 hover:text-destructive'
      : ''

  return (
    <button
      onClick={onClick}
      className={`${baseClass} ${variantClass} ${className}`}
    >
      {icon}
      {children}
    </button>
  )
}

interface ViewDetailsItemProps {
  entityId: string
  entityType:
    | 'people'
    | 'teams'
    | 'initiatives'
    | 'tasks'
    | 'meetings'
    | 'oneonones'
  close: () => void
}

export function ViewDetailsMenuItem({
  entityId,
  entityType,
  close,
}: ViewDetailsItemProps) {
  const router = useRouter()

  return (
    <ContextMenuItem
      onClick={() => {
        router.push(`/${entityType}/${entityId}`)
        close()
      }}
      icon={<Eye className='h-4 w-4' />}
    >
      View Details
    </ContextMenuItem>
  )
}

interface EditItemProps {
  entityId: string
  entityType:
    | 'people'
    | 'teams'
    | 'initiatives'
    | 'tasks'
    | 'meetings'
    | 'oneonones'
  close: () => void
}

export function EditMenuItem({ entityId, entityType, close }: EditItemProps) {
  const router = useRouter()

  return (
    <ContextMenuItem
      onClick={() => {
        router.push(`/${entityType}/${entityId}/edit`)
        close()
      }}
      icon={<Edit className='h-4 w-4' />}
    >
      Edit
    </ContextMenuItem>
  )
}

interface DeleteItemProps {
  onDelete: () => void
  close: () => void
  label?: string
}

export function DeleteMenuItem({
  onDelete,
  close,
  label = 'Delete',
}: DeleteItemProps) {
  return (
    <ContextMenuItem
      onClick={() => {
        onDelete()
        close()
      }}
      icon={<Trash2 className='h-4 w-4' />}
      variant='destructive'
    >
      {label}
    </ContextMenuItem>
  )
}

interface MarkAsDoneItemProps {
  taskId: string
  currentStatus: string
  close: () => void
  onSuccess?: () => void
}

export function MarkAsDoneMenuItem({
  taskId,
  currentStatus,
  close,
  onSuccess,
}: MarkAsDoneItemProps) {
  const handleMarkAsDone = async () => {
    try {
      await updateTaskStatus(taskId, TASK_STATUS.DONE)
      toast.success('Task marked as done')
      onSuccess?.()
      close()
    } catch (error) {
      console.error('Failed to mark task as done:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to mark task as done'
      )
    }
  }

  // Only show the menu item if the task is not already done
  if (currentStatus === TASK_STATUS.DONE) {
    return null
  }

  return (
    <ContextMenuItem
      onClick={handleMarkAsDone}
      icon={<Check className='h-4 w-4' />}
    >
      Mark as Done
    </ContextMenuItem>
  )
}

interface SetDueDateMenuItemProps {
  taskId: string
  close: () => void
  onSuccess?: () => void
}

export function SetDueDateMenuItem({
  taskId,
  close,
  onSuccess,
}: SetDueDateMenuItemProps) {
  const handleSetDueDate = async (dueDate: Date | null) => {
    try {
      await updateTaskDueDate(taskId, dueDate)
      const dateLabel = dueDate
        ? dueDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'removed'
      toast.success(`Due date set to ${dateLabel}`)
      onSuccess?.()
      close()
    } catch (error) {
      console.error('Failed to set due date:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to set due date'
      )
    }
  }

  // Calculate the quick date options
  const now = new Date()
  const laterToday = new Date(now)
  laterToday.setHours(23, 59, 59, 999)

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(23, 59, 59, 999)

  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(23, 59, 59, 999)

  const nextMonth = new Date(now)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  nextMonth.setHours(23, 59, 59, 999)

  return (
    <>
      <Separator className='my-sm' />
      <div className='px-md py-md text-xs font-semibold text-muted-foreground'>
        Set Due Date
      </div>
      <ContextMenuItem
        onClick={() => handleSetDueDate(laterToday)}
        icon={<Calendar className='h-4 w-4' />}
      >
        Later Today
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => handleSetDueDate(tomorrow)}
        icon={<Calendar className='h-4 w-4' />}
      >
        Tomorrow
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => handleSetDueDate(nextWeek)}
        icon={<Calendar className='h-4 w-4' />}
      >
        Next Week
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => handleSetDueDate(nextMonth)}
        icon={<Calendar className='h-4 w-4' />}
      >
        Next Month
      </ContextMenuItem>
    </>
  )
}
