import { redirect } from 'next/navigation'
import { OrganizationMembersDataTable } from '@/components/organization-members/data-table'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { OrganizationUsersBreadcrumbClient } from '@/components/organization/organization-users-breadcrumb-client'
import { OrganizationProfileButton } from '@/components/organization/organization-profile-button'
import { Users } from 'lucide-react'

export default async function OrganizationUsersPage() {
  const user = await getCurrentUser()

  // Check if user is admin
  if (!isAdminOrOwner(user)) {
    redirect('/dashboard')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    redirect('/dashboard')
  }

  return (
    <OrganizationUsersBreadcrumbClient>
      <PageContainer>
        <PageHeader
          title='Manage Users'
          titleIcon={Users}
          subtitle='Manage organization members and invitations'
          actions={<OrganizationProfileButton />}
        />

        <PageContent>
          <OrganizationMembersDataTable
            settingsId='organization-members'
            currentUserId={user.managerOSUserId || ''}
          />
        </PageContent>
      </PageContainer>
    </OrganizationUsersBreadcrumbClient>
  )
}
