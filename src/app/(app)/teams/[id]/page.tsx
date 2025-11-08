import { TeamDetailClient } from '@/components/teams/team-detail-client'
import { TeamDetailContent } from '@/components/teams/team-detail-content'
import { notFound } from 'next/navigation'

import { redirect } from 'next/navigation'
import { getTeamById } from '@/lib/data/teams'
import { getCurrentUser } from '@/lib/auth-utils'

interface TeamDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    redirect('/organization/create')
  }

  const { id } = await params
  const team = await getTeamById(id, user.organizationId)

  if (!team) {
    notFound()
  }

  return (
    <TeamDetailClient
      teamName={team.name}
      teamId={team.id}
      teamAvatar={team.avatar}
      isAdmin={user.role === 'ADMIN'}
    >
      <TeamDetailContent team={team} isAdmin={user.role === 'ADMIN'} />
    </TeamDetailClient>
  )
}
