import { redirect } from 'next/navigation'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { getCurrentUser, wasRemovedFromOrganization } from '@/lib/auth-utils'
import { getPendingInvitationsForUser } from '@/lib/clerk'
import { OrganizationNewPageClient } from '@/components/organization/organization-new-page-client'

export default async function OrganizationNewPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Check if user was removed from an organization (via cookie set by getCurrentUser)
  const wasRemoved = await wasRemovedFromOrganization()

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
          <OrganizationNewPageClient
            pendingInvitations={pendingInvitations}
            wasRemovedFromOrganization={wasRemoved}
          />
        </PageMain>
      </PageContent>
    </PageContainer>
  )
}
