import { TeamDetailClient } from '@/components/teams/team-detail-client'
import { TeamDetailContent } from '@/components/teams/team-detail-content'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTeamById } from '@/lib/data/teams'

interface TeamDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user.organizationId) {
    redirect('/organization/create')
  }

  const { id } = await params
  const team = await getTeamById(id, session.user.organizationId)

  if (!team) {
    notFound()
  }

  return (
    <TeamDetailClient
      teamName={team.name}
      teamId={team.id}
      teamAvatar={team.avatar}
      isAdmin={session.user.role === 'ADMIN'}
    >
      <TeamDetailContent team={team} isAdmin={session.user.role === 'ADMIN'} />
    </TeamDetailClient>
  )
}
