import { CreateTaskButton } from '@/components/tasks/create-task-button'
import { ListTodo } from 'lucide-react'
import { TaskDataTable } from '../../../components/tasks/data-table'
import { PageSection } from '@/components/ui/page-section'
import { Suspense } from 'react'
import { RequireAuthServer } from '@/components/auth/require-auth-server'

function TasksPageContent() {
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
          <CreateTaskButton variant='default' />
        </div>
      </div>

      <PageSection>
        <TaskDataTable enablePagination={true} />
      </PageSection>
    </div>
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className='page-container'>Loading...</div>}>
      <RequireAuthServer requireOrganization={true}>
        <TasksPageContent />
      </RequireAuthServer>
    </Suspense>
  )
}
