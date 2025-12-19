import { OrganizationMembersDataTable } from '@/components/organization-members/data-table'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { requireAdmin } from '@/lib/auth-utils'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'
import { OrganizationProfileButton } from '@/components/organization/organization-profile-button'
import { Users } from 'lucide-react'

export default async function OrganizationUsersPage() {
  // Require admin role and organization membership
  const user = await requireAdmin()

  const pathname = '/organization/users'
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Organization Settings', href: '/organization/settings' },
    { name: 'Manage Users', href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
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
            currentUserRole={
              (user.role?.toUpperCase() as 'ADMIN' | 'OWNER' | 'USER') || 'USER'
            }
          />
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
