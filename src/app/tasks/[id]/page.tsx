import { getTask } from '@/lib/actions/task'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TaskDetailBreadcrumbClient } from '@/components/tasks/task-detail-breadcrumb-client'
import { TaskActionsDropdown } from '@/components/tasks/task-actions-dropdown'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { TaskSidebar } from '@/components/tasks/task-sidebar'
import { SectionHeader } from '@/components/ui/section-header'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Clock, FileText, ListTodo } from 'lucide-react'
import { taskStatusUtils, type TaskStatus } from '@/lib/task-status'
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

  // Get entity links for this task
  const entityLinks = await prisma.entityLink.findMany({
    where: {
      entityType: 'Task',
      entityId: id,
      organizationId: session.user.organizationId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <TaskDetailBreadcrumbClient taskTitle={task.title} taskId={task.id}>
      <div className='space-y-6'>
        {/* Header - Full Width */}
        <div className='px-4 lg:px-6'>
          <div className='page-header'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-2'>
                  <ListTodo className='h-6 w-6 text-muted-foreground' />
                  <h1 className='page-title'>{task.title}</h1>
                </div>

                {/* Status, Priority, Created Date, and Assignee in subheader */}
                <div className='flex flex-wrap items-center gap-3 mt-2 mb-3'>
                  <Badge
                    variant={taskStatusUtils.getUIVariant(
                      task.status as TaskStatus
                    )}
                  >
                    {taskStatusUtils.getLabel(task.status as TaskStatus)}
                  </Badge>
                  <Badge
                    variant={taskPriorityUtils.getUIVariant(
                      task.priority as TaskPriority
                    )}
                  >
                    {taskPriorityUtils.getLabel(task.priority as TaskPriority)}
                  </Badge>
                  <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                    <Calendar className='w-4 h-4' />
                    <span>
                      Created {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {task.assignee && (
                    <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                      <User className='w-4 h-4' />
                      <Link
                        href={`/people/${task.assignee.id}`}
                        className='hover:text-primary transition-colors'
                      >
                        {task.assignee.name}
                      </Link>
                    </div>
                  )}
                  {task.completedAt && (
                    <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                      <Clock className='w-4 h-4' />
                      <span>
                        Completed{' '}
                        {new Date(task.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <TaskActionsDropdown
                taskId={task.id}
                task={{
                  id: task.id,
                  title: task.title,
                  status: task.status as TaskStatus,
                  assignee: task.assignee,
                  initiative: task.initiative,
                  team: task.team,
                }}
              />
            </div>
          </div>
        </div>

        {/* Main Content and Sidebar */}
        <div className='flex flex-col lg:flex-row gap-6 px-4 lg:px-6'>
          {/* Main Content */}
          <div className='flex-1 min-w-0'>
            <div className='space-y-6'>
              {/* Task Description */}
              <div className='page-section'>
                <SectionHeader icon={FileText} title='Description' />
                {task.description ? (
                  <ReadonlyNotesField
                    content={task.description}
                    variant='default'
                    emptyStateText='No description provided'
                  />
                ) : (
                  <div className='text-muted-foreground italic'>
                    No description provided
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <TaskSidebar
            links={entityLinks.map(link => ({
              id: link.id,
              url: link.url,
              title: link.title,
              description: link.description,
              createdAt: link.createdAt,
              updatedAt: link.updatedAt,
              createdBy: link.createdBy,
            }))}
            entityId={task.id}
            initiative={task.initiative}
            objective={task.objective}
            estimate={task.estimate}
            dueDate={task.dueDate}
            createdBy={task.createdBy}
            updatedAt={task.updatedAt}
          />
        </div>
      </div>
    </TaskDetailBreadcrumbClient>
  )
}
