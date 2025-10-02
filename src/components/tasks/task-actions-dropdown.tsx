'use client'

import Link from 'next/link'
import { Edit, Eye, Target, Building2 } from 'lucide-react'
import { DeleteTaskButton } from '@/components/tasks/delete-task-button'
import { ActionDropdown } from '@/components/common/action-dropdown'

interface TaskActionsDropdownProps {
  taskId: string
  task: {
    id: string
    title: string
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
  return (
    <ActionDropdown size={size}>
      {({ close }) => (
        <div className='py-1'>
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

          {task.assignee && (
            <Link
              href={`/people/${task.assignee.id}`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <Eye className='w-4 h-4' />
              View Assignee
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

          <div className='px-3 py-2'>
            <DeleteTaskButton taskId={taskId} />
          </div>
        </div>
      )}
    </ActionDropdown>
  )
}
