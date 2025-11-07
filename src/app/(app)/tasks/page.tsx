import { CreateTaskButton } from '@/components/tasks/create-task-button'
import { ListTodo } from 'lucide-react'
import { TaskDataTable } from '../../../components/tasks/data-table'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'

export default function TasksPage() {
  return (
    <PageContainer>
      <PageHeader
        title='Tasks'
        titleIcon={ListTodo}
        subtitle='Manage and track all tasks across your organization'
        actions={<CreateTaskButton variant='default' />}
      />

      <PageContent>
        <PageSection>
          <TaskDataTable enablePagination={true} />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
