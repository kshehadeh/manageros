import { MyTasksPageClient } from '@/components/tasks/my-tasks-page-client'
import { CreateTaskButton } from '@/components/tasks/create-task-button'
import { CheckSquare } from 'lucide-react'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { HELP_IDS } from '@/lib/help'

export default async function MyTasksPage() {
  const user = await getCurrentUser()
  const canCreateTasks = isAdminOrOwner(user) || !!user.managerOSPersonId

  return (
    <PageContainer>
      <PageHeader
        title='My Tasks'
        titleIcon={CheckSquare}
        subtitle='Track and manage tasks assigned to you'
        helpId={HELP_IDS.tasksProjectsTasks}
        actions={canCreateTasks ? <CreateTaskButton variant='default' /> : null}
      />

      <PageContent>
        <PageSection>
          <MyTasksPageClient personId={user.managerOSPersonId ?? null} />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
