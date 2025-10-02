import { PersonForm } from '@/components/people/person-form'
import { getTeams, getPeople, getJobRolesForSelection } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
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
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user is admin
  if (!isAdmin(session.user)) {
    redirect('/people')
  }

  const params = await searchParams
  const managerId = params.managerId
  const teamId = params.teamId

  const [teams, people, jobRoles] = await Promise.all([
    getTeams(),
    getPeople(),
    getJobRolesForSelection(),
  ])

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>New Person</h2>
      </div>

      <PersonForm
        teams={teams}
        people={people}
        jobRoles={jobRoles}
        initialManagerId={managerId}
        initialTeamId={teamId}
      />
    </div>
  )
}
