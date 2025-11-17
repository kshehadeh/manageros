import { prisma } from '@/lib/db'
import { getTask } from '@/lib/actions/task'

import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskDetailBreadcrumbClient } from '@/components/tasks/task-detail-breadcrumb-client'
import { PageSection } from '@/components/ui/page-section'
import { type TaskStatus } from '@/lib/task-status'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  const { id } = await params
  if (!(await getActionPermission(user, 'task.edit', id))) {
    redirect('/dashboard')
  }

  const task = await getTask(id)

  if (!task) {
    notFound()
  }

  // Get all people and objectives for the form
  const [people, objectives] = await Promise.all([
    prisma.person.findMany({
      where: {
        organizationId: user.managerOSOrganizationId || '',
      },
      orderBy: { name: 'asc' },
    }),
    prisma.objective.findMany({
      where: {
        initiative: {
          organizationId: user.managerOSOrganizationId || '',
        },
      },
      orderBy: { title: 'asc' },
    }),
  ])

  // Prepare initial data for the form
  const initialData = {
    title: task.title,
    description: task.description || '',
    assigneeId: task.assigneeId || '',
    status: task.status as TaskStatus,
    priority: task.priority,
    dueDate: task.dueDate
      ? new Date(task.dueDate).toISOString().split('T')[0]
      : '',
    initiativeId: task.initiativeId || '',
    objectiveId: task.objectiveId || '',
  }

  return (
    <TaskDetailBreadcrumbClient taskTitle={task.title} taskId={task.id}>
      <div className='page-container'>
        <PageSection>
          <TaskForm
            people={people}
            objectives={objectives}
            initialData={initialData}
            isEditing={true}
            taskId={task.id}
            header={{
              title: 'Edit Task',
              subtitle: 'Update task details and assignments',
            }}
          />
        </PageSection>
      </div>
    </TaskDetailBreadcrumbClient>
  )
}
