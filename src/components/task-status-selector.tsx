'use client'

import { useState } from 'react'
import { updateTaskStatus } from '@/lib/actions'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TaskStatusSelectorProps {
  taskId: string
  currentStatus: 'todo' | 'doing' | 'blocked' | 'done' | 'dropped'
}

const statusLabels = {
  todo: 'To Do',
  doing: 'Doing',
  blocked: 'Blocked',
  done: 'Done',
  dropped: 'Dropped',
}

const statusColors = {
  todo: 'badge',
  doing: 'rag-amber',
  blocked: 'rag-red',
  done: 'rag-green',
  dropped: 'badge',
}

export function TaskStatusSelector({
  taskId,
  currentStatus,
}: TaskStatusSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  async function handleStatusChange(
    newStatus: 'todo' | 'doing' | 'blocked' | 'done' | 'dropped'
  ) {
    if (newStatus === currentStatus) return

    setIsUpdating(true)
    try {
      await updateTaskStatus(taskId, newStatus)
    } catch (error) {
      console.error('Error updating task status:', error)
      alert('Error updating task status. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`badge ${statusColors[currentStatus]} flex items-center gap-1 hover:opacity-80 transition-opacity ${
            isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          disabled={isUpdating}
        >
          {statusLabels[currentStatus]}
          <ChevronDown className='w-3 h-3' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
        {Object.entries(statusLabels).map(([status, label]) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusChange(status as any)}
            className={status === currentStatus ? 'bg-neutral-800' : ''}
          >
            <span
              className={`badge ${statusColors[status as keyof typeof statusColors]} mr-2`}
            >
              {label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
