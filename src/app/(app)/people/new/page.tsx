import { PersonForm } from '@/components/people/person-form'
import { getJobRolesForSelection } from '@/lib/actions/job-roles'

import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'

interface NewPersonPageProps {
  searchParams: Promise<{
    managerId?: string
    teamId?: string
  }>
}

export default async function NewPersonPage({
  searchParams,
}: NewPersonPageProps) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    redirect('/organization/create')
  }

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    redirect('/people')
  }

  const params = await searchParams
  const managerId = params.managerId
  const teamId = params.teamId

  const [jobRoles] = await Promise.all([getJobRolesForSelection()])

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>New Person</h2>
      </div>

      <PersonForm
        jobRoles={jobRoles}
        initialManagerId={managerId}
        initialTeamId={teamId}
      />
    </div>
  )
}
