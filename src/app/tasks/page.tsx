import { getTasks } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Task, Person, Initiative, Objective } from '@prisma/client'

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
  const tasksByStatus = {
    todo: tasks.filter(task => task.status === 'todo'),
    doing: tasks.filter(task => task.status === 'doing'),
    blocked: tasks.filter(task => task.status === 'blocked'),
    done: tasks.filter(task => task.status === 'done'),
    dropped: tasks.filter(task => task.status === 'dropped'),
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
        {/* Task Statistics */}
        <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className='card text-center'>
              <div className='text-2xl font-bold'>{statusTasks.length}</div>
              <div className='text-sm text-neutral-400'>
                {statusLabels[status as keyof typeof statusLabels]}
              </div>
            </div>
          ))}
        </div>

        {/* Tasks by Status */}
        <div className='grid gap-6 lg:grid-cols-2 xl:grid-cols-3'>
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className='card'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-semibold'>
                  {statusLabels[status as keyof typeof statusLabels]} (
                  {statusTasks.length})
                </h3>
              </div>
              <div className='space-y-3'>
                {statusTasks.length === 0 ? (
                  <div className='text-neutral-400 text-sm text-center py-4'>
                    No{' '}
                    {statusLabels[
                      status as keyof typeof statusLabels
                    ].toLowerCase()}{' '}
                    tasks
                  </div>
                ) : (
                  statusTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task as TaskWithRelations}
                      statusColor={
                        statusColors[status as keyof typeof statusColors]
                      }
                      priorityColor={
                        priorityColors[
                          task.priority as keyof typeof priorityColors
                        ]
                      }
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TaskCard({
  task,
  statusColor,
  priorityColor,
}: {
  task: TaskWithRelations
  statusColor: string
  priorityColor: string
}) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className='block border border-neutral-800 rounded-xl p-3 hover:bg-neutral-800/60 transition-colors'
    >
      <div className='space-y-2'>
        <div className='flex items-start justify-between'>
          <h4 className='font-medium text-sm leading-tight'>{task.title}</h4>
          <div className='flex items-center gap-1 ml-2'>
            <span className={`badge ${statusColor} text-xs`}>
              {task.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`badge ${priorityColor} text-xs`}>
              P{task.priority}
            </span>
          </div>
        </div>

        {task.description && (
          <p className='text-xs text-neutral-400 line-clamp-2'>
            {task.description}
          </p>
        )}

        <div className='space-y-1'>
          {task.assignee && (
            <div className='text-xs text-neutral-500'>
              <span className='font-medium'>Assignee:</span>{' '}
              {task.assignee.name}
            </div>
          )}

          {task.initiative && (
            <div className='text-xs text-neutral-500'>
              <span className='font-medium'>Initiative:</span>{' '}
              <Link
                href={`/initiatives/${task.initiative.id}`}
                className='text-blue-400 hover:text-blue-300'
                onClick={e => e.stopPropagation()}
              >
                {task.initiative.title}
              </Link>
            </div>
          )}

          {task.objective && (
            <div className='text-xs text-neutral-500'>
              <span className='font-medium'>Objective:</span>{' '}
              {task.objective.title}
            </div>
          )}

          {task.dueDate && (
            <div className='text-xs text-neutral-500'>
              <span className='font-medium'>Due:</span>{' '}
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}

          {task.estimate && (
            <div className='text-xs text-neutral-500'>
              <span className='font-medium'>Estimate:</span> {task.estimate}h
            </div>
          )}
        </div>

        <div className='text-xs text-neutral-600'>
          Updated {new Date(task.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  )
}
