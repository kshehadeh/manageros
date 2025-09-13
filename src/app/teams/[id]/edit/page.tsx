import { TeamForm } from '@/components/team-form'
import { getTeam } from '@/lib/actions'
import Link from 'next/link'
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
