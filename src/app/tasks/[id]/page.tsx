import { getTask } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import { DeleteTaskButton } from '@/components/delete-task-button'
import { EditIconButton } from '@/components/edit-icon-button'
import { TaskDetailBreadcrumbClient } from '@/components/task-detail-breadcrumb-client'
import { Eye } from 'lucide-react'

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

  const statusLabels = {
    todo: 'To Do',
    doing: 'Doing',
    blocked: 'Blocked',
    done: 'Done',
    dropped: 'Dropped',
  }

  const statusColors = {
    todo: 'badge',
    doing: 'rag-amber',
    blocked: 'rag-red',
    done: 'rag-green',
    dropped: 'badge',
  }

  const priorityColors = {
    1: 'rag-red',
    2: 'rag-amber',
    3: 'badge',
    4: 'rag-green',
    5: 'rag-green',
  }

  return (
    <TaskDetailBreadcrumbClient taskTitle={task.title} taskId={task.id}>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>{task.title}</h1>
            <div className='flex items-center gap-3 mt-2'>
              <span
                className={`badge ${statusColors[task.status as keyof typeof statusColors]}`}
              >
                {statusLabels[task.status as keyof typeof statusLabels]}
              </span>
              <span
                className={`badge ${priorityColors[task.priority as keyof typeof priorityColors]}`}
              >
                Priority {task.priority}
              </span>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <EditIconButton
              href={`/tasks/${task.id}/edit`}
              variant='outline'
              size='default'
            />
            <DeleteTaskButton taskId={task.id} />
          </div>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          {/* Task Details */}
          <div className='card'>
            <h3 className='font-semibold mb-4'>Task Details</h3>
            <div className='space-y-4'>
              {task.description && (
                <div>
                  <span className='text-sm font-medium text-neutral-300'>
                    Description:
                  </span>
                  <div className='mt-1 text-sm text-neutral-400'>
                    {task.description}
                  </div>
                </div>
              )}

              {task.assignee && (
                <div>
                  <span className='text-sm font-medium text-neutral-300'>
                    Assignee:
                  </span>
                  <div className='mt-1'>
                    <Link
                      href={`/people/${task.assignee.id}`}
                      className='text-blue-400 hover:text-blue-300 font-medium'
                    >
                      {task.assignee.name}
                    </Link>
                  </div>
                </div>
              )}

              {task.initiative && (
                <div>
                  <span className='text-sm font-medium text-neutral-300'>
                    Initiative:
                  </span>
                  <div className='mt-1'>
                    <Link
                      href={`/initiatives/${task.initiative.id}`}
                      className='text-blue-400 hover:text-blue-300 font-medium'
                    >
                      {task.initiative.title}
                    </Link>
                  </div>
                </div>
              )}

              {task.objective && (
                <div>
                  <span className='text-sm font-medium text-neutral-300'>
                    Objective:
                  </span>
                  <div className='mt-1 text-sm text-neutral-400'>
                    {task.objective.title}
                  </div>
                </div>
              )}

              {task.estimate && (
                <div>
                  <span className='text-sm font-medium text-neutral-300'>
                    Estimate:
                  </span>
                  <div className='mt-1 text-sm text-neutral-400'>
                    {task.estimate} hours
                  </div>
                </div>
              )}

              {task.dueDate && (
                <div>
                  <span className='text-sm font-medium text-neutral-300'>
                    Due Date:
                  </span>
                  <div className='mt-1 text-sm text-neutral-400'>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Task Metadata */}
          <div className='card'>
            <h3 className='font-semibold mb-4'>Metadata</h3>
            <div className='space-y-4'>
              <div>
                <span className='text-sm font-medium text-neutral-300'>
                  Created:
                </span>
                <div className='mt-1 text-sm text-neutral-400'>
                  {new Date(task.createdAt).toLocaleString()}
                </div>
              </div>

              <div>
                <span className='text-sm font-medium text-neutral-300'>
                  Last Updated:
                </span>
                <div className='mt-1 text-sm text-neutral-400'>
                  {new Date(task.updatedAt).toLocaleString()}
                </div>
              </div>

              {task.completedAt && (
                <div>
                  <span className='text-sm font-medium text-neutral-300'>
                    Completed:
                  </span>
                  <div className='mt-1 text-sm text-neutral-400'>
                    {new Date(task.completedAt).toLocaleString()}
                  </div>
                </div>
              )}

              <div>
                <span className='text-sm font-medium text-neutral-300'>
                  Task ID:
                </span>
                <div className='mt-1 text-sm text-neutral-400 font-mono'>
                  {task.id}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className='flex items-center gap-3'>
          {task.initiative && (
            <Button asChild variant='outline'>
              <Link
                href={`/initiatives/${task.initiative.id}`}
                className='flex items-center gap-2'
              >
                <Eye className='w-4 h-4' />
                View Initiative
              </Link>
            </Button>
          )}
          {task.assignee && (
            <Button asChild variant='outline'>
              <Link
                href={`/people/${task.assignee.id}`}
                className='flex items-center gap-2'
              >
                <Eye className='w-4 h-4' />
                View Assignee
              </Link>
            </Button>
          )}
        </div>
      </div>
    </TaskDetailBreadcrumbClient>
  )
}
