import { TeamForm } from '@/components/team-form'
import { getTeam } from '@/lib/actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface EditTeamPageProps {
  params: {
    id: string
  }
}

export default async function EditTeamPage({ params }: EditTeamPageProps) {
  const team = await getTeam(params.id)

  if (!team) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit {team.name}</h2>
        <Link href="/teams" className="btn">
          Back to Teams
        </Link>
      </div>
      
      <TeamForm team={team} />
    </div>
  )
}
