import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getOrganizationMembers,
  getOrganizationInvitations,
} from '@/lib/actions/organization'
import OrganizationMembersList from '@/components/organization-members-list'
import OrganizationInvitationsSection from '@/components/organization-invitations-section'
import { PageSection } from '@/components/ui/page-section'
import { UserCheck } from 'lucide-react'

export default async function OrganizationMembersPage() {
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

  const members = await getOrganizationMembers()
  const invitations = await getOrganizationInvitations()

  return (
    <div className='page-container'>
      <div className='page-header'>
        <h1 className='page-title flex items-center gap-2'>
          <UserCheck className='h-6 w-6' />
          Organization Members ({members.length})
        </h1>
        <p className='page-subtitle'>
          Manage member roles and remove users from your organization.
        </p>
      </div>

      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Main Content */}
        <div className='flex-1'>
          <PageSection>
            <OrganizationMembersList
              members={members}
              currentUserId={session.user.id}
            />
          </PageSection>
        </div>

        {/* Right Sidebar */}
        <div className='w-full lg:w-80'>
          <OrganizationInvitationsSection invitations={invitations} />
        </div>
      </div>
    </div>
  )
}
