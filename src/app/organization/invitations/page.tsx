import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOrganizationInvitations } from '@/lib/actions/organization'
import InvitationForm from '@/components/invitation-form'
import InvitationList from '@/components/invitation-list'
import { InvitationsBreadcrumbClient } from '@/components/organization/invitations-breadcrumb-client'
import { PageSection } from '@/components/ui/page-section'

export default async function OrganizationInvitationsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user is admin
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Check if user belongs to an organization
  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const invitations = await getOrganizationInvitations()

  return (
    <InvitationsBreadcrumbClient>
      <div className='page-container'>
        <div className='page-header'>
          <h1 className='page-title'>Organization Invitations</h1>
          <p className='page-subtitle'>
            Invite users to join your organization. They will be automatically
            added when they create their account.
          </p>
        </div>

        <PageSection>
          <InvitationForm />
          <InvitationList invitations={invitations} />
        </PageSection>
      </div>
    </InvitationsBreadcrumbClient>
  )
}
