'use client'

import { useState, useEffect } from 'react'
import { TaskList, type Task } from '@/components/tasks/task-list'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface TaskListWithDataProps {
  fetchTasks: () => Promise<Task[]>
  title?: string
  variant?: 'compact' | 'full'
  showAddButton?: boolean
  initiativeId?: string
  viewAllHref?: string
  viewAllLabel?: string
  emptyStateText?: string
  className?: string
}

export function TaskListWithData({
  fetchTasks,
  title = 'Tasks',
  variant = 'compact',
  showAddButton = false,
  initiativeId,
  viewAllHref,
  viewAllLabel = 'View All',
  emptyStateText = 'No tasks found.',
  className = '',
}: TaskListWithDataProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadTasks = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      const fetchedTasks = await fetchTasks()
      setTasks(fetchedTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTaskUpdate = () => {
    loadTasks(true)
  }

  const handleRefresh = () => {
    loadTasks(true)
  }

  if (isLoading) {
    return (
      <div
        className={`rounded-xl py-4 -mx-3 px-3 md:mx-0 md:px-4 space-y-4 ${className}`}
      >
        <div className='flex items-center justify-center py-8'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
          <span className='ml-2 text-sm text-muted-foreground'>
            Loading tasks...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className='relative'>
      <TaskList
        tasks={tasks}
        title={title}
        variant={variant}
        showAddButton={showAddButton}
        initiativeId={initiativeId}
        viewAllHref={viewAllHref}
        viewAllLabel={viewAllLabel}
        emptyStateText={emptyStateText}
        onTaskUpdate={handleTaskUpdate}
        className={className}
      />

      {/* Refresh Button */}
      <Button
        variant='ghost'
        size='sm'
        onClick={handleRefresh}
        disabled={isRefreshing}
        className='absolute top-2 right-2 h-8 w-8 p-0'
      >
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
        />
      </Button>
    </div>
  )
}
