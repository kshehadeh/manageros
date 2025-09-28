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
import { Badge } from '@/components/ui/badge'
import {
  type TaskStatus,
  taskStatusUtils,
  ALL_TASK_STATUSES,
} from '@/lib/task-status'

interface TaskStatusSelectorProps {
  taskId: string
  currentStatus: TaskStatus
}

export function TaskStatusSelector({
  taskId,
  currentStatus,
}: TaskStatusSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  async function handleStatusChange(newStatus: TaskStatus) {
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
          className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${
            isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          disabled={isUpdating}
        >
          <Badge variant={taskStatusUtils.getUIVariant(currentStatus)}>
            {taskStatusUtils.getLabel(currentStatus)}
            <ChevronDown className='w-3 h-3 ml-1' />
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
        {ALL_TASK_STATUSES.map(status => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
            className={status === currentStatus ? 'bg-accent' : ''}
          >
            <Badge variant={taskStatusUtils.getUIVariant(status)}>
              {taskStatusUtils.getLabel(status)}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
