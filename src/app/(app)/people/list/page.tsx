import { PeopleListClient } from '@/components/people/people-list-client'
import {
  getActionPermission,
  getCurrentUser,
  getCurrentUserWithPersonAndOrganization,
} from '@/lib/auth-utils'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { User } from 'lucide-react'
import { PeopleActionsDropdown } from '@/components/people/people-actions-dropdown'
import { PeopleViewDropdown } from '@/components/people/people-view-dropdown'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

export default async function PeopleListPage() {
  const user = await getCurrentUser()
  const canCreatePeople = await getActionPermission(user, 'person.create')
  const canImportPeople = await getActionPermission(user, 'person.import')

  // Get current person ID for filter
  const { person } = await getCurrentUserWithPersonAndOrganization()

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'People', href: '/people' },
    { name: 'List', href: '/people/list' },
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
          <PeopleListClient currentPersonId={person?.id} />
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
