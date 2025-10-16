'use client'

import { Eye, Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

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
  const variantClass = variant === 'destructive' ? 'text-destructive' : ''

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
