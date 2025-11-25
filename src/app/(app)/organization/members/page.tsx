import { OrganizationMembersDataTable } from '@/components/organization-members/data-table'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { requireAdmin } from '@/lib/auth-utils'

export default async function OrganizationDetailsPage() {
  // Require admin role and organization membership
  const user = await requireAdmin()

  return (
    <PageContainer>
      <PageHeader
        title='Organization Members'
        subtitle='Manage member roles and invitations'
      />

      <PageContent>
        <OrganizationMembersDataTable
          settingsId='organization-members'
          currentUserId={user.managerOSUserId || ''}
        />
      </PageContent>
    </PageContainer>
  )
}
