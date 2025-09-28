import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOrganizationMembers } from '@/lib/actions'
import OrganizationMembersList from '@/components/organization-members-list'
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

      <div className='page-section'>
        <OrganizationMembersList
          members={members}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  )
}
