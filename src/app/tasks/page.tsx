import { getTasks } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QuickTaskForm } from '@/components/quick-task-form'
import { TaskCard } from '@/components/task-card'
import { Task, Person, Initiative, Objective, User } from '@prisma/client'
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
  createdBy: User | null
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
