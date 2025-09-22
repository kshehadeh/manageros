import { getTasks } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuickTaskForm } from '@/components/quick-task-form'
import { Task, Person, Initiative, Objective } from '@prisma/client'
import {
  type TaskStatus,
  taskStatusUtils,
  ALL_TASK_STATUSES,
  TASK_STATUS,
  ACTIVE_STATUSES,
} from '@/lib/task-status'

type TaskWithRelations = Task & {
  assignee: Person | null
  initiative: Initiative | null
  objective: Objective | null
}

export default async function TasksPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const tasks = await getTasks()

  // Group tasks by status
  const tasksByStatus = ALL_TASK_STATUSES.reduce(
    (acc, status) => {
      acc[status] = tasks.filter(task => task.status === status)
      return acc
    },
    {} as Record<TaskStatus, TaskWithRelations[]>
  )

  // Get active tasks (not completed)
  const activeTasks = ACTIVE_STATUSES.flatMap(
    (status: TaskStatus) => tasksByStatus[status]
  )

  // Get recently completed tasks (done in last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentlyCompletedTasks = tasksByStatus[TASK_STATUS.DONE].filter(
    task => task.completedAt && new Date(task.completedAt) >= thirtyDaysAgo
  )

  const priorityVariants = {
    1: 'error' as const,
    2: 'warning' as const,
    3: 'neutral' as const,
    4: 'success' as const,
    5: 'success' as const,
  }

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='page-title'>Tasks</h1>
            <p className='page-subtitle'>
              Manage and track all tasks across your organization
            </p>
          </div>
          <Button asChild variant='outline'>
            <Link href='/tasks/new'>Create Task</Link>
          </Button>
        </div>
      </div>

      <div className='page-section'>
        <QuickTaskForm />
      </div>

      <div className='page-section'>
        <div className='grid gap-6 lg:grid-cols-2'>
          {/* Active Tasks */}
          <div className='card'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold'>Active Tasks</h2>
              <span className='text-sm text-muted-foreground'>
                {activeTasks.length} tasks
              </span>
            </div>
            <div className='space-y-3'>
              {activeTasks.length === 0 ? (
                <div className='text-muted-foreground text-sm text-center py-8'>
                  No active tasks
                </div>
              ) : (
                activeTasks.map((task: TaskWithRelations) => (
                  <TaskCard
                    key={task.id}
                    task={task as TaskWithRelations}
                    statusVariant={taskStatusUtils.getUIVariant(
                      task.status as TaskStatus
                    )}
                    priorityVariant={
                      priorityVariants[
                        task.priority as keyof typeof priorityVariants
                      ]
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* Recently Completed Tasks */}
          <div className='card'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold'>Recently Completed</h2>
              <span className='text-sm text-muted-foreground'>
                {recentlyCompletedTasks.length} tasks (last 30 days)
              </span>
            </div>
            <div className='space-y-3'>
              {recentlyCompletedTasks.length === 0 ? (
                <div className='text-muted-foreground text-sm text-center py-8'>
                  No tasks completed in the last 30 days
                </div>
              ) : (
                recentlyCompletedTasks.map((task: TaskWithRelations) => (
                  <TaskCard
                    key={task.id}
                    task={task as TaskWithRelations}
                    statusVariant={taskStatusUtils.getUIVariant(
                      task.status as TaskStatus
                    )}
                    priorityVariant={
                      priorityVariants[
                        task.priority as keyof typeof priorityVariants
                      ]
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskCard({
  task,
  statusVariant,
  priorityVariant,
}: {
  task: TaskWithRelations
  statusVariant: 'neutral' | 'warning' | 'error' | 'success'
  priorityVariant: 'neutral' | 'warning' | 'error' | 'success'
}) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className='block border border-border rounded-xl p-3 hover:bg-accent/50 transition-colors'
    >
      <div className='space-y-2'>
        <div className='flex items-start justify-between'>
          <h4 className='font-medium text-sm leading-tight text-foreground'>
            {task.title}
          </h4>
          <div className='flex items-center gap-1 ml-2'>
            <Badge variant={statusVariant} className='text-xs'>
              {taskStatusUtils
                .getLabel(task.status as TaskStatus)
                .toUpperCase()}
            </Badge>
            <Badge variant={priorityVariant} className='text-xs'>
              P{task.priority}
            </Badge>
          </div>
        </div>

        {task.description && (
          <p className='text-xs text-muted-foreground line-clamp-2'>
            {task.description}
          </p>
        )}

        <div className='space-y-1'>
          {task.assignee && (
            <div className='text-xs text-muted-foreground'>
              <span className='font-medium'>Assignee:</span>{' '}
              {task.assignee.name}
            </div>
          )}

          {task.initiative && (
            <div className='text-xs text-muted-foreground'>
              <span className='font-medium'>Initiative:</span>{' '}
              <Link
                href={`/initiatives/${task.initiative.id}`}
                className='text-primary hover:text-primary/80 transition-colors'
                onClick={e => e.stopPropagation()}
              >
                {task.initiative.title}
              </Link>
            </div>
          )}

          {task.objective && (
            <div className='text-xs text-muted-foreground'>
              <span className='font-medium'>Objective:</span>{' '}
              {task.objective.title}
            </div>
          )}

          {task.dueDate && (
            <div className='text-xs text-muted-foreground'>
              <span className='font-medium'>Due:</span>{' '}
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}

          {task.estimate && (
            <div className='text-xs text-muted-foreground'>
              <span className='font-medium'>Estimate:</span> {task.estimate}h
            </div>
          )}
        </div>

        <div className='text-xs text-muted-foreground'>
          Updated {new Date(task.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  )
}
