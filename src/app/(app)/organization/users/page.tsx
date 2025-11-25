import { OrganizationMembersDataTable } from '@/components/organization-members/data-table'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { requireAdmin } from '@/lib/auth-utils'
import { OrganizationUsersBreadcrumbClient } from '@/components/organization/organization-users-breadcrumb-client'
import { OrganizationProfileButton } from '@/components/organization/organization-profile-button'
import { Users } from 'lucide-react'

export default async function OrganizationUsersPage() {
  // Require admin role and organization membership
  const user = await requireAdmin()

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
