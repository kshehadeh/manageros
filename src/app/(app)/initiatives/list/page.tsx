import { InitiativeDataTable } from '@/components/initiatives/data-table'
import { Rocket } from 'lucide-react'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
import { InitiativesListActionsDropdown } from '@/components/initiatives/initiatives-list-actions-dropdown'
import { InitiativesViewDropdown } from '@/components/initiatives/initiatives-view-dropdown'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

export default async function InitiativesListPage() {
  const user = await getCurrentUser()
  const canCreateInitiatives = await getActionPermission(
    user,
    'initiative.create'
  )

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Initiatives', href: '/initiatives' },
    { name: 'List', href: '/initiatives/list' },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
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
          <PageSection>
            <InitiativeDataTable enablePagination={true} />
          </PageSection>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
