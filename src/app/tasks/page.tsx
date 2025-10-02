import { getTasks, getInitiatives } from '@/lib/actions'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-utils'
import { GroupedTasksPageClient } from '@/components/tasks/grouped-tasks-page-client'
import { CreateTaskButton } from '@/components/tasks/create-task-button'
import { ListTodo } from 'lucide-react'

export default async function TasksPage() {
  const user = await requireAuth({ requireOrganization: true })

  const [tasks, people, initiatives] = await Promise.all([
    getTasks(),
    prisma.person.findMany({
      where: {
        organizationId: user.organizationId!,
      },
      orderBy: { name: 'asc' },
    }),
    getInitiatives(),
  ])

  return (
    <div className='page-container px-3 md:px-0'>
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
          <CreateTaskButton />
        </div>
      </div>

      <div className='page-section -mx-3 md:mx-0'>
        <GroupedTasksPageClient
          tasks={tasks}
          people={people}
          initiatives={initiatives}
        />
      </div>
    </div>
  )
}
