import { requireAuth } from '@/lib/auth-utils'
import { MyTasksPageClient } from '@/components/tasks/my-tasks-page-client'
import { CreateTaskButton } from '@/components/tasks/create-task-button'
import { CheckSquare } from 'lucide-react'
import { PageSection } from '@/components/ui/page-section'

export default async function MyTasksPage() {
  const user = await requireAuth({ requireOrganization: true })

  return (
    <div className='page-container'>
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
          <CreateTaskButton variant='default' />
        </div>
      </div>

      <PageSection>
        <MyTasksPageClient personId={user.personId} />
      </PageSection>
    </div>
  )
}
