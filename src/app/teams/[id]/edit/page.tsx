import { TeamForm } from '@/components/teams/team-form'
import { TeamEditHeader } from '@/components/teams/team-edit-header'
import { TeamEditClient } from '@/components/teams/team-edit-client'
import { getTeam } from '@/lib/actions/team'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface EditTeamPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditTeamPage({ params }: EditTeamPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id } = await params
  const team = await getTeam(id)

  if (!team) {
    notFound()
  }

  return (
    <TeamEditClient teamName={team.name} teamId={team.id}>
      <div className='space-y-6'>
        <TeamEditHeader
          teamId={team.id}
          teamName={team.name}
          currentAvatar={team.avatar || null}
        />

        <TeamForm team={team} />
      </div>
    </TeamEditClient>
  )
}
