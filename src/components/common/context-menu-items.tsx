'use client'

import { Eye, Edit, Trash2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import { toast } from 'sonner'
import { updateTaskStatus } from '@/lib/actions/task'
import { TASK_STATUS } from '@/lib/task-status'

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
    'w-full px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 text-left'
  const variantClass =
    variant === 'destructive'
      ? 'text-destructive-foreground bg-destructive'
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
