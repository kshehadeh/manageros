'use client'

import { Button } from '@/components/ui/button'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { Plus, ChevronDown, Pickaxe } from 'lucide-react'

interface TasksListActionsDropdownProps {
  canCreateTask: boolean
}

export function TasksListActionsDropdown({
  canCreateTask,
}: TasksListActionsDropdownProps) {
  if (!canCreateTask) {
    return null
  }

  const handleCreateTask = () => {
    // Dispatch the same event that the command palette uses
    window.dispatchEvent(new CustomEvent('command:openCreateTaskModal'))
  }

  return (
    <ActionDropdown
      trigger={({ toggle }) => (
        <Button
          variant='outline'
          size='sm'
          className='flex items-center gap-2'
          onClick={toggle}
        >
          <Pickaxe className='w-4 h-4' />
          <span className='hidden sm:inline'>Actions</span>
          <ChevronDown className='w-4 h-4' />
        </Button>
      )}
    >
      {({ close }) => (
        <div className='py-1'>
          {canCreateTask && (
            <button
              type='button'
              onClick={() => {
                handleCreateTask()
                close()
              }}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left'
            >
              <Plus className='w-4 h-4' />
              Create Task
            </button>
          )}
        </div>
      )}
    </ActionDropdown>
  )
}
