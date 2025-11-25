import { redirect } from 'next/navigation'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { getCurrentUser } from '@/lib/auth-utils'
import { getPendingInvitationsForUser } from '@/lib/actions/organization'
import { OrganizationNewPageClient } from '@/components/organization/organization-new-page-client'

export default async function OrganizationNewPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // If user already has an organization, redirect to dashboard
  if (user.managerOSOrganizationId) {
    redirect('/dashboard')
  }

  // Get pending invitations
  const pendingInvitations = await getPendingInvitationsForUser(
    user.clerkUserId || null
  )

  return (
    <PageContainer>
      <PageHeader
        title='Create or Join Organization'
        subtitle='Set up your organization or accept an invitation to join an existing one'
      />

      <PageContent>
        <PageMain>
          <OrganizationNewPageClient pendingInvitations={pendingInvitations} />
        </PageMain>
      </PageContent>
    </PageContainer>
  )
}
