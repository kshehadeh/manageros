import { getTask } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TaskDetailBreadcrumbClient } from '@/components/task-detail-breadcrumb-client'
import { TaskStatusSelector } from '@/components/task-status-selector'
import { TaskActionsDropdown } from '@/components/task-actions-dropdown'
import { Calendar, User, Clock } from 'lucide-react'
import { type TaskStatus } from '@/lib/task-status'
import { taskPriorityUtils, type TaskPriority } from '@/lib/task-priority'

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const { id } = await params
  const task = await getTask(id)

  if (!task) {
    notFound()
  }

  const priorityColors = {
    1: taskPriorityUtils.getRAGVariant(1),
    2: taskPriorityUtils.getRAGVariant(2),
    3: taskPriorityUtils.getRAGVariant(3),
    4: taskPriorityUtils.getRAGVariant(4),
    5: taskPriorityUtils.getRAGVariant(5),
  }

  return (
    <TaskDetailBreadcrumbClient taskTitle={task.title} taskId={task.id}>
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className='page-title'>{task.title}</h1>
                <TaskStatusSelector
                  taskId={task.id}
                  currentStatus={task.status as TaskStatus}
                />
                <span
                  className={`badge ${priorityColors[task.priority as keyof typeof priorityColors]}`}
                >
                  {taskPriorityUtils.getLabel(task.priority as TaskPriority)}
                </span>
              </div>

              {/* Basic Information with Icons */}
              <div className='flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Calendar className='w-4 h-4' />
                  <span>
                    Created {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {task.completedAt && (
                  <div className='flex items-center gap-1'>
                    <Clock className='w-4 h-4' />
                    <span>
                      Completed{' '}
                      {new Date(task.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {task.assignee && (
                  <div className='flex items-center gap-1'>
                    <User className='w-4 h-4' />
                    <Link
                      href={`/people/${task.assignee.id}`}
                      className='hover:text-primary transition-colors'
                    >
                      {task.assignee.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <TaskActionsDropdown taskId={task.id} task={task} />
          </div>
        </div>

        {/* Task Description */}
        <div className='page-section'>
          <h2 className='page-section-title'>Description</h2>
          {task.description ? (
            <div className='prose prose-sm max-w-none'>{task.description}</div>
          ) : (
            <div className='text-muted-foreground italic'>
              No description provided
            </div>
          )}
        </div>

        {/* Additional Details */}
        {(task.initiative ||
          task.objective ||
          task.estimate ||
          task.dueDate ||
          task.createdBy) && (
          <div className='page-section'>
            <div className='card'>
              <div className='grid gap-4 md:grid-cols-2'>
                {task.initiative && (
                  <div>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Initiative:
                    </span>
                    <div className='mt-1'>
                      <Link
                        href={`/initiatives/${task.initiative.id}`}
                        className='text-primary hover:text-primary/80 font-medium'
                      >
                        {task.initiative.title}
                      </Link>
                    </div>
                  </div>
                )}

                {task.objective && (
                  <div>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Objective:
                    </span>
                    <div className='mt-1 text-sm'>{task.objective.title}</div>
                  </div>
                )}

                {task.estimate && (
                  <div>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Estimate:
                    </span>
                    <div className='mt-1 text-sm'>{task.estimate} hours</div>
                  </div>
                )}

                {task.dueDate && (
                  <div>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Due Date:
                    </span>
                    <div className='mt-1 text-sm'>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {task.createdBy && (
                  <div>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Created By:
                    </span>
                    <div className='mt-1 text-sm'>{task.createdBy.name}</div>
                  </div>
                )}

                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Last Updated:
                  </span>
                  <div className='mt-1 text-sm'>
                    {new Date(task.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TaskDetailBreadcrumbClient>
  )
}
