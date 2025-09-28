import { getTasks, getInitiatives } from '@/lib/actions'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QuickTaskForm } from '@/components/quick-task-form'
import { TasksPageClient } from '@/components/tasks-page-client'
import { ListTodo } from 'lucide-react'

export default async function TasksPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const [tasks, people, initiatives] = await Promise.all([
    getTasks(),
    prisma.person.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { name: 'asc' },
    }),
    getInitiatives(),
  ])

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <ListTodo className='h-6 w-6 text-muted-foreground' />
              <h1 className='page-title'>Tasks</h1>
            </div>
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
        <QuickTaskForm />
      </div>

      <div className='page-section'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>All Tasks</h2>
        </div>
        <TasksPageClient
          tasks={tasks}
          people={people}
          initiatives={initiatives}
        />
      </div>
    </div>
  )
}
