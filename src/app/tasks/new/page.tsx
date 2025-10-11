import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TaskForm } from '@/components/tasks/task-form'

export default async function NewTaskPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
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

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div>
          <h1 className='page-title'>Create New Task</h1>
          <p className='page-subtitle'>
            Create a new task for your organization
          </p>
        </div>
      </div>

      <div className='page-section'>
        <div className='card'>
          <TaskForm people={people} objectives={objectives} />
        </div>
      </div>
    </div>
  )
}
