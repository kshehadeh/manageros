'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface CreateTaskButtonProps {
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
}

export function CreateTaskButton({
  variant = 'outline',
  size = 'default',
  className,
  children,
}: CreateTaskButtonProps) {
  const handleClick = () => {
    // Dispatch the same event that the command palette uses
    window.dispatchEvent(new CustomEvent('command:openCreateTaskModal'))
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      {children || (
        <>
          <Plus className='h-4 w-4 mr-2' />
          Create Task
        </>
      )}
    </Button>
  )
}
