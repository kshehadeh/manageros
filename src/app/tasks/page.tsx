import { requireAuth } from '@/lib/auth-utils'
import { CreateTaskButton } from '@/components/tasks/create-task-button'
import { ListTodo } from 'lucide-react'
import { TaskDataTable } from '../../components/tasks/data-table'

export default async function TasksPage() {
  await requireAuth({ requireOrganization: true })

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

      <div className='page-section'>
        <TaskDataTable enablePagination={true} />
      </div>
    </div>
  )
}
