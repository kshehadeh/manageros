import { MyTasksPageClient } from '@/components/tasks/my-tasks-page-client'
import { CreateTaskButton } from '@/components/tasks/create-task-button'
import { CheckSquare } from 'lucide-react'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getOptionalUser } from '@/lib/auth-utils'

export default async function MyTasksPage() {
  const user = await getOptionalUser()

  return (
    <PageContainer>
      <PageHeader
        title='My Tasks'
        titleIcon={CheckSquare}
        subtitle='Track and manage tasks assigned to you'
        actions={<CreateTaskButton variant='default' />}
      />

      <PageContent>
        <PageSection>
          <MyTasksPageClient personId={user?.personId ?? null} />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
