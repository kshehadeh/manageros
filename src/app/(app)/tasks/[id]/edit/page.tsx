import { prisma } from '@/lib/db'
import { getTask } from '@/lib/actions/task'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskDetailBreadcrumbClient } from '@/components/tasks/task-detail-breadcrumb-client'
import { PageSection } from '@/components/ui/page-section'
import { type TaskStatus } from '@/lib/task-status'

export default async function EditTaskPage({
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

  // Get all people and objectives for the form
  const [people, objectives] = await Promise.all([
    prisma.person.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.objective.findMany({
      where: {
        initiative: {
          organizationId: session.user.organizationId,
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
        <div className='page-header'>
          <div>
            <h1 className='page-title'>Edit Task</h1>
            <p className='page-subtitle'>Update task details and assignments</p>
          </div>
        </div>

        <PageSection>
          <TaskForm
            people={people}
            objectives={objectives}
            initialData={initialData}
            isEditing={true}
            taskId={task.id}
          />
        </PageSection>
      </div>
    </TaskDetailBreadcrumbClient>
  )
}
