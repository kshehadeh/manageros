import { PersonForm } from '@/components/person-form'
import { getTeams, getPeople } from '@/lib/actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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

  const [teams, people] = await Promise.all([getTeams(), getPeople()])

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>New Person</h2>
        <Button asChild variant='outline'>
          <Link href='/people'>Back to People</Link>
        </Button>
      </div>

      <PersonForm
        teams={teams}
        people={people}
        initialManagerId={managerId}
        initialTeamId={teamId}
      />
    </div>
  )
}
