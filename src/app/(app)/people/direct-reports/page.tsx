import { PeopleDataTable } from '@/components/people/data-table'
import { Users } from 'lucide-react'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getCurrentUser } from '@/lib/auth-utils'
import { PeopleViewDropdown } from '@/components/people/people-view-dropdown'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

export default async function DirectReportsPage() {
  const user = await getCurrentUser()

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'People', href: '/people' },
    { name: 'Direct Reports', href: '/people/direct-reports' },
  ]

  // If user doesn't have a personId, they can't have direct reports
  if (!user.managerOSPersonId) {
    return (
      <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
        <PageContainer>
          <PageHeader
            title='Direct Reports'
            titleIcon={Users}
            actions={<PeopleViewDropdown />}
          />
          <PageContent>
            <PageSection>
              <div className='text-muted-foreground text-sm text-center py-8'>
                You need to be linked to a person record to view direct reports.
              </div>
            </PageSection>
          </PageContent>
        </PageContainer>
      </PageBreadcrumbSetter>
    )
  }

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title='Direct Reports'
          titleIcon={Users}
          actions={<PeopleViewDropdown />}
        />

        <PageContent>
          <PageSection>
            <PeopleDataTable
              settingsId='direct-reports'
              immutableFilters={{
                managerId: user.managerOSPersonId,
                status: 'active',
              }}
            />
          </PageSection>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
