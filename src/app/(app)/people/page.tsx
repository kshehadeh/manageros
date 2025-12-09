import { PeoplePageClient } from '@/components/people/people-page-client'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { User } from 'lucide-react'
import { PeopleActionsDropdown } from '@/components/people/people-actions-dropdown'
import { PeopleViewDropdown } from '@/components/people/people-view-dropdown'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

export default async function PeoplePage() {
  const user = await getCurrentUser()
  const canCreatePeople = await getActionPermission(user, 'person.create')
  const canImportPeople = await getActionPermission(user, 'person.import')

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'People', href: '/people' },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer className='px-3 md:px-0'>
        <PageHeader
          title='People'
          titleIcon={User}
          helpId='people-teams/people'
          actions={
            <div className='flex flex-wrap items-center gap-3'>
              <PeopleViewDropdown />
              <PeopleActionsDropdown
                canCreatePeople={canCreatePeople}
                canImportPeople={canImportPeople}
              />
            </div>
          }
        />

        <PageContent>
          <PeoplePageClient />
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
