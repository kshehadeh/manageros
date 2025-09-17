import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TaskForm } from '@/components/task-form'

export default async function NewTaskPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
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

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Create New Task</h1>
        <p className='text-neutral-400'>
          Create a new task for your organization
        </p>
      </div>

      <div className='card'>
        <TaskForm
          people={people}
          initiatives={initiatives}
          objectives={objectives}
        />
      </div>
    </div>
  )
}
