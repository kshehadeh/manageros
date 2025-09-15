import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOrganizationInvitations } from '@/lib/actions'
import InvitationForm from '@/components/invitation-form'
import InvitationList from '@/components/invitation-list'

export default async function OrganizationInvitationsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user is admin
  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  // Check if user belongs to an organization
  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const invitations = await getOrganizationInvitations()

  return (
    <div className='min-h-screen py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-neutral-100'>
            Organization Invitations
          </h1>
          <p className='mt-2 text-neutral-400'>
            Invite users to join your organization. They will be automatically
            added when they create their account.
          </p>
        </div>

        <div className='space-y-8'>
          <InvitationForm />
          <InvitationList invitations={invitations} />
        </div>
      </div>
    </div>
  )
}
