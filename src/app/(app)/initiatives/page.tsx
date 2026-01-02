import { InitiativesDashboardServer } from '@/components/initiatives/initiatives-dashboard-server'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
// Import widgets to register them
import '@/components/widgets'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Rocket } from 'lucide-react'
import { InitiativesListActionsDropdown } from '@/components/initiatives/initiatives-list-actions-dropdown'
import { InitiativesViewDropdown } from '@/components/initiatives/initiatives-view-dropdown'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'
import { InitiativesViewRedirect } from '@/components/initiatives/initiatives-view-redirect'

export default async function InitiativesPage() {
  const user = await getCurrentUser()
  const canCreateInitiatives = await getActionPermission(
    user,
    'initiative.create'
  )

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Initiatives', href: '/initiatives' },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <InitiativesViewRedirect />
      <PageContainer>
        <PageHeader
          title='Initiatives'
          titleIcon={Rocket}
          helpId='tasks-projects/initiatives'
          subtitle='Manage long-term goals and objectives'
          actions={
            <div className='flex flex-wrap items-center gap-3'>
              <InitiativesViewDropdown />
              <InitiativesListActionsDropdown
                canCreateInitiative={canCreateInitiatives}
              />
            </div>
          }
        />
        <PageContent>
          <InitiativesDashboardServer />
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
