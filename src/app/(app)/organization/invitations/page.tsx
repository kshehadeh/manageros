import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOrganizationInvitations } from '@/lib/actions/organization'
import InvitationForm from '@/components/invitation-form'
import InvitationList from '@/components/invitation-list'
import { InvitationsBreadcrumbClient } from '@/components/organization/invitations-breadcrumb-client'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'

export default async function OrganizationInvitationsPage() {
  const session = await getServerSession(authOptions)

  // Check if user is admin
  if (session?.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Check if user belongs to an organization
  if (!session?.user.organizationId) {
    redirect('/organization/create')
  }

  const invitations = await getOrganizationInvitations()

  return (
    <InvitationsBreadcrumbClient>
      <PageContainer>
        <PageHeader
          title='Organization Invitations'
          subtitle='Invite users to join your organization. They will be automatically added when they create their account.'
        />

        <PageContent>
          <PageSection>
            <InvitationForm />
            <InvitationList invitations={invitations} />
          </PageSection>
        </PageContent>
      </PageContainer>
    </InvitationsBreadcrumbClient>
  )
}
