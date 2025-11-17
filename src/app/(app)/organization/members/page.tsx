import { redirect } from 'next/navigation'
import { getOrganizationInvitations } from '@/lib/actions/organization'
import { OrganizationMembersDataTable } from '@/components/organization-members/data-table'
import OrganizationInvitationsSection from '@/components/organization-invitations-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'

export default async function OrganizationDetailsPage() {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    redirect('/dashboard')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    redirect('/organization/create')
  }

  const invitations = await getOrganizationInvitations()

  return (
    <PageContainer>
      <PageHeader
        title='Organization Members'
        subtitle='Manage member roles and invitations'
      />

      <PageContent>
        <PageMain>
          <OrganizationMembersDataTable
            settingsId='organization-members'
            currentUserId={user.managerOSUserId || ''}
          />
        </PageMain>

        <PageSidebar>
          <OrganizationInvitationsSection invitations={invitations} />
        </PageSidebar>
      </PageContent>
    </PageContainer>
  )
}
