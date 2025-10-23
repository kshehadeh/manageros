'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { Checkbox } from '@/components/ui/checkbox'
import { ListTodo, Eye } from 'lucide-react'
import Link from 'next/link'
import { TaskQuickEditDialog } from '@/components/tasks/task-quick-edit-dialog'
import { taskStatusUtils, TASK_STATUS } from '@/lib/task-status'
import type { TaskStatus } from '@/lib/task-status'
import { formatDistanceToNow } from 'date-fns'
import { updateTaskStatus } from '@/lib/actions/task'
import { toast } from 'sonner'

interface Task {
  id: string
  title: string
  description?: string | null
  assigneeId?: string | null
  dueDate?: Date | null
  priority: number
  status: string // Changed from TaskStatus to string to match Prisma
  initiative?: {
    title: string
  } | null
}

interface DashboardAssignedTasksClientSectionProps {
  tasks: Task[]
}

export function DashboardAssignedTasksClientSection({
  tasks,
}: DashboardAssignedTasksClientSectionProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set())

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsDialogOpen(true)
  }

  const handleTaskComplete = async (
    taskId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation() // Prevent opening the dialog

    // Immediately add to processing state for visual feedback
    setProcessingTasks(prev => new Set(prev).add(taskId))

    try {
      await updateTaskStatus(taskId, TASK_STATUS.DONE)
      // Move from processing to completed
      setProcessingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
      setCompletedTasks(prev => new Set(prev).add(taskId))
      toast.success('Task marked as completed!')
    } catch (error) {
      console.error('Error completing task:', error)
      // Remove from processing state on error
      setProcessingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
      toast.error('Failed to complete task')
    }
  }

  const handleTaskUpdate = () => {
    // Refresh the page to show updated data
    window.location.reload()
  }

  // Filter out completed tasks
  const visibleTasks = tasks.filter(task => !completedTasks.has(task.id))

  return (
    <>
      <section className='rounded-xl py-4 -mx-3 px-3 md:mx-0 md:px-4 space-y-4'>
        <SectionHeader
          icon={ListTodo}
          title='Assigned Tasks'
          action={
            <Button asChild variant='outline' size='sm'>
              <Link href='/my-tasks' className='flex items-center gap-2'>
                <Eye className='w-4 h-4' />
                My Tasks
              </Link>
            </Button>
          }
        />

        <div className='space-y-3'>
          {visibleTasks.length === 0 ? (
            <div className='text-neutral-400 text-sm'>
              No active tasks assigned to you.
            </div>
          ) : (
            visibleTasks.map(task => {
              const statusInfo = taskStatusUtils.getUIVariant(
                task.status as TaskStatus
              )
              const statusVariant =
                statusInfo === 'success'
                  ? 'default'
                  : statusInfo === 'warning'
                    ? 'secondary'
                    : statusInfo === 'error'
                      ? 'destructive'
                      : 'outline'

              return (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                    processingTasks.has(task.id) ? 'opacity-75' : ''
                  }`}
                >
                  <div className='flex items-center gap-3 flex-1 min-w-0'>
                    <Checkbox
                      checked={
                        processingTasks.has(task.id) ||
                        completedTasks.has(task.id)
                      }
                      onClick={e => handleTaskComplete(task.id, e)}
                      className='shrink-0'
                      disabled={processingTasks.has(task.id)}
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between mb-1'>
                        <h3
                          className={`font-medium text-sm truncate ${
                            processingTasks.has(task.id) ||
                            completedTasks.has(task.id)
                              ? 'line-through text-muted-foreground'
                              : ''
                          }`}
                        >
                          {task.title}
                        </h3>
                        <Badge variant={statusVariant} className='text-xs'>
                          {taskStatusUtils.getLabel(task.status as TaskStatus)}
                        </Badge>
                      </div>

                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        {task.initiative && (
                          <>
                            <span className='truncate'>
                              {task.initiative.title}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        {task.dueDate && (
                          <span>
                            Due{' '}
                            {formatDistanceToNow(task.dueDate, {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {selectedTask && (
        <TaskQuickEditDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          task={{
            ...selectedTask,
            status: selectedTask.status as TaskStatus,
          }}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </>
  )
}
