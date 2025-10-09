import { getInitiatives } from '@/lib/actions/initiative'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-utils'
import { MyTasksPageClient } from '@/components/tasks/my-tasks-page-client'
import { CreateTaskButton } from '@/components/tasks/create-task-button'
import { CheckSquare } from 'lucide-react'

export default async function MyTasksPage() {
  const user = await requireAuth({ requireOrganization: true })

  const [people, initiatives] = await Promise.all([
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
              <CheckSquare className='h-6 w-6 text-muted-foreground' />
              <h1 className='page-title'>My Tasks</h1>
            </div>
            <p className='page-subtitle'>
              Track and manage tasks assigned to you
            </p>
          </div>
          <CreateTaskButton />
        </div>
      </div>

      <div className='page-section -mx-3 md:mx-0'>
        <MyTasksPageClient people={people} initiatives={initiatives} />
      </div>
    </div>
  )
}
