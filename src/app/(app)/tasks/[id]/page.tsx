import { getTask } from '@/lib/actions/task'
import { getEntityLinks } from '@/lib/data/entity-links'

import { redirect } from 'next/navigation'
import { Link } from '@/components/ui/link'
import { notFound } from 'next/navigation'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'
import { TaskActionsDropdown } from '@/components/tasks/task-actions-dropdown'
import { InlineEditableText } from '@/components/common/inline-editable-text'
import { TaskSidebar } from '@/components/tasks/task-sidebar'
import { TaskPropertiesSidebar } from '@/components/tasks/task-properties-sidebar'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageContent } from '@/components/ui/page-content'
import { PageHeader } from '@/components/ui/page-header'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { MobileBottomPanel } from '@/components/ui/mobile-bottom-panel'
import { Calendar, User, Clock, FileText, ListTodo } from 'lucide-react'
import { type TaskStatus } from '@/lib/task-status'
import { type TaskPriority } from '@/lib/task-priority'
import { updateTaskTitle, updateTaskDescription } from '@/lib/actions/task'
import { getCurrentUser } from '@/lib/auth-utils'

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    redirect('/dashboard')
  }

  const { id } = await params
  const task = await getTask(id)

  if (!task) {
    notFound()
  }

  // Get entity links for this task
  const entityLinksResult = await getEntityLinks(
    'Task',
    id,
    user.managerOSOrganizationId,
    {
      includeCreatedBy: true,
    }
  )

  // Type assertion: when includeCreatedBy is true, createdBy will be included
  const entityLinks = entityLinksResult as Array<
    (typeof entityLinksResult)[0] & {
      createdBy: { id: string; name: string; email: string }
    }
  >

  const pathname = `/tasks/${task.id}`
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Tasks', href: '/tasks' },
    { name: task.title, href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          titleIcon={ListTodo}
          title={
            <InlineEditableText
              value={task.title}
              onValueChange={async newTitle => {
                'use server'
                await updateTaskTitle(task.id, newTitle)
              }}
              placeholder='Enter task title'
              className='page-title'
            />
          }
          subtitle={
            <div className='flex flex-wrap items-center gap-3'>
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
                    className='hover:text-highlight transition-colors'
                  >
                    {task.assignee.name}
                  </Link>
                </div>
              )}
              {task.completedAt && (
                <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                  <Clock className='w-4 h-4' />
                  <span>
                    Completed {new Date(task.completedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          }
          actions={
            <TaskActionsDropdown
              taskId={task.id}
              task={{
                id: task.id,
                title: task.title,
                status: task.status as TaskStatus,
                assignee: task.assignee,
                initiative: task.initiative,
              }}
            />
          }
        />

        <PageContent>
          <PageMain>
            <div className='space-y-6'>
              {/* Task Description */}
              <PageSection
                header={<SectionHeader icon={FileText} title='Description' />}
              >
                <InlineEditableText
                  value={task.description || ''}
                  onValueChange={async newDescription => {
                    'use server'
                    await updateTaskDescription(task.id, newDescription)
                  }}
                  placeholder='Enter task description'
                  multiline={true}
                  emptyStateText='Click to add description'
                />
              </PageSection>
            </div>
          </PageMain>

          <PageSidebar>
            <div className='space-y-6'>
              {/* Properties sidebar - hidden on mobile, shown in bottom panel instead */}
              <div className='hidden lg:block'>
                <TaskPropertiesSidebar
                  taskId={task.id}
                  status={task.status as TaskStatus}
                  priority={task.priority as TaskPriority}
                  assignee={task.assignee}
                  initiative={task.initiative}
                  objective={task.objective}
                  estimate={task.estimate}
                  dueDate={task.dueDate}
                  createdBy={task.createdBy}
                  updatedAt={task.updatedAt}
                />
              </div>
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
              />
            </div>
          </PageSidebar>
        </PageContent>
      </PageContainer>

      {/* Mobile bottom panel for properties */}
      <MobileBottomPanel title='Details'>
        <TaskPropertiesSidebar
          taskId={task.id}
          status={task.status as TaskStatus}
          priority={task.priority as TaskPriority}
          assignee={task.assignee}
          initiative={task.initiative}
          objective={task.objective}
          estimate={task.estimate}
          dueDate={task.dueDate}
          createdBy={task.createdBy}
          updatedAt={task.updatedAt}
          showHeader={false}
        />
      </MobileBottomPanel>
    </PageBreadcrumbSetter>
  )
}
