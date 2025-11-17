import { CreateTaskButton } from '@/components/tasks/create-task-button'
import { ListTodo } from 'lucide-react'
import { TaskDataTable } from '../../../components/tasks/data-table'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'

export default async function TasksPage() {
  const user = await getCurrentUser()
  const canCreateTasks = isAdminOrOwner(user) || !!user.managerOSPersonId

  return (
    <PageContainer>
      <PageHeader
        title='Tasks'
        titleIcon={ListTodo}
        subtitle='Manage and track all tasks across your organization'
        actions={canCreateTasks ? <CreateTaskButton variant='default' /> : null}
      />

      <PageContent>
        <PageSection>
          <TaskDataTable enablePagination={true} />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
