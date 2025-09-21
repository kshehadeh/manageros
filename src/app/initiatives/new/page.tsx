import { InitiativeForm } from '@/components/initiative-form'
import { getTeams, getPeople } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface NewInitiativePageProps {
  searchParams: Promise<{
    ownerId?: string
    teamId?: string
  }>
}

export default async function NewInitiativePage({
  searchParams,
}: NewInitiativePageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { ownerId, teamId } = await searchParams

  const [teams, people] = await Promise.all([getTeams(), getPeople()])

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>New Initiative</h2>
      </div>

      <InitiativeForm
        teams={teams}
        people={people}
        preselectedOwnerId={ownerId}
        preselectedTeamId={teamId}
      />
    </div>
  )
}
