import { redirect } from 'next/navigation'
import {
  getOrganizationMembers,
  getOrganizationInvitations,
} from '@/lib/actions/organization'
import OrganizationMembersList from '@/components/organization-members-list'
import OrganizationInvitationsSection from '@/components/organization-invitations-section'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { UserCheck } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth-utils'

export default async function OrganizationMembersPage() {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    redirect('/organization/create')
  }

  const members = await getOrganizationMembers()
  const invitations = await getOrganizationInvitations()

  return (
    <PageContainer>
      <PageHeader
        title={`Organization Members (${members.length})`}
        titleIcon={UserCheck}
        subtitle='Manage member roles and remove users from your organization.'
      />

      <PageContent>
        <PageMain>
          <PageSection>
            <OrganizationMembersList
              members={members}
              currentUserId={user.id}
            />
          </PageSection>
        </PageMain>

        <PageSidebar>
          <OrganizationInvitationsSection invitations={invitations} />
        </PageSidebar>
      </PageContent>
    </PageContainer>
  )
}
