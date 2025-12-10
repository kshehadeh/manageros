import { MyTasksPageClient } from '@/components/tasks/my-tasks-page-client'
import { TasksListActionsDropdown } from '@/components/tasks/tasks-list-actions-dropdown'
import { CheckSquare } from 'lucide-react'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { HELP_IDS } from '@/lib/help'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

export default async function MyTasksPage() {
  const user = await getCurrentUser()
  const canCreateTasks = isAdminOrOwner(user) || !!user.managerOSPersonId

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'My Tasks', href: '/my-tasks' },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title='My Tasks'
          titleIcon={CheckSquare}
          subtitle='Track and manage tasks assigned to you'
          helpId={HELP_IDS.tasksProjectsTasks}
          actions={<TasksListActionsDropdown canCreateTask={canCreateTasks} />}
        />

        <PageContent>
          <PageSection>
            <MyTasksPageClient personId={user.managerOSPersonId ?? null} />
          </PageSection>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
