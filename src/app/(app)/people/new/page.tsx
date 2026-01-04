import { PersonForm } from '@/components/people/person-form'
import { getJobRolesForSelection } from '@/lib/actions/job-roles'
import { requireAuth } from '@/lib/auth-utils'

interface NewPersonPageProps {
  searchParams: Promise<{
    managerId?: string
    teamId?: string
    name?: string
  }>
}

export default async function NewPersonPage({
  searchParams,
}: NewPersonPageProps) {
  // Require organization and admin role, redirect to /people if not admin
  await requireAuth({
    requireOrganization: true,
    requireAdmin: true,
    redirectTo: '/people',
  })

  const params = await searchParams
  const managerId = params.managerId
  const teamId = params.teamId
  const name = params.name

  const jobRoles = await getJobRolesForSelection()

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>New Person</h2>
      </div>

      <PersonForm
        jobRoles={jobRoles}
        initialManagerId={managerId}
        initialTeamId={teamId}
        initialName={name}
      />
    </div>
  )
}
