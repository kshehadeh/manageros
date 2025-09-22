import { prisma } from '@/lib/db'
import { getTask } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { TaskForm } from '@/components/task-form'
import { TaskDetailBreadcrumbClient } from '@/components/task-detail-breadcrumb-client'

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

  // Get all people, initiatives, and objectives for the form
  const [people, initiatives, objectives] = await Promise.all([
    prisma.person.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.initiative.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { title: 'asc' },
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
    status: task.status as 'todo' | 'doing' | 'blocked' | 'done' | 'dropped',
    priority: task.priority,
    estimate: task.estimate || undefined,
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

        <div className='page-section'>
          <div className='card'>
            <TaskForm
              people={people}
              initiatives={initiatives}
              objectives={objectives}
              initialData={initialData}
              isEditing={true}
              taskId={task.id}
            />
          </div>
        </div>
      </div>
    </TaskDetailBreadcrumbClient>
  )
}
