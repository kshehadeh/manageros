'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Edit, Eye, Target, Building2 } from 'lucide-react'
import { DeleteTaskButton } from '@/components/delete-task-button'

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
  const [openDropdown, setOpenDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown(!openDropdown)
  }

  const closeDropdown = () => {
    setOpenDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false)
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  return (
    <div className='relative' ref={dropdownRef}>
      <Button
        variant='ghost'
        size={size}
        className={`${size === 'sm' ? 'h-8 w-8 p-0' : 'h-8 w-8 p-0'}`}
        onClick={handleDropdownClick}
      >
        <MoreHorizontal className='h-4 w-4' />
      </Button>

      {openDropdown && (
        <div
          className='absolute top-full right-0 mt-2 bg-popover text-popover-foreground border rounded-md shadow-lg z-10 min-w-48'
          onClick={e => e.stopPropagation()}
        >
          <div className='py-1'>
            {/* Edit Task */}
            <Link
              href={`/tasks/${taskId}/edit`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={closeDropdown}
            >
              <Edit className='w-4 h-4' />
              Edit Task
            </Link>

            {/* View Initiative */}
            {task.initiative && (
              <Link
                href={`/initiatives/${task.initiative.id}`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={closeDropdown}
              >
                <Target className='w-4 h-4' />
                View Initiative
              </Link>
            )}

            {/* View Assignee */}
            {task.assignee && (
              <Link
                href={`/people/${task.assignee.id}`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={closeDropdown}
              >
                <Eye className='w-4 h-4' />
                View Assignee
              </Link>
            )}

            {/* View Team */}
            {task.team && (
              <Link
                href={`/teams/${task.team.id}`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={closeDropdown}
              >
                <Building2 className='w-4 h-4' />
                View Team
              </Link>
            )}

            {/* Divider */}
            <div className='border-t border-border my-1' />

            {/* Delete Task */}
            <div className='px-3 py-2'>
              <DeleteTaskButton taskId={taskId} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
