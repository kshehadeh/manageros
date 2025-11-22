import { redirect } from 'next/navigation'
import { OrganizationMembersDataTable } from '@/components/organization-members/data-table'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'

export default async function OrganizationDetailsPage() {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    redirect('/dashboard')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    redirect('/dashboard')
  }

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
