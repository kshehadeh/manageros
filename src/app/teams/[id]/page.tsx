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

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const { id } = await params
  const teamResult = await getTeamById(id, session.user.organizationId, {
    includeParent: true,
    includeChildren: true,
    includePeople: true,
    includeInitiatives: true,
  })

  if (!teamResult) {
    notFound()
  }

  // Type assertion: when options are provided, relations will be included
  const team = teamResult as typeof teamResult & {
    people: Array<{
      id: string
      name: string
      email: string | null
      role: string | null
      status: string
      birthday: Date | null
      avatar: string | null
      manager?: {
        id: string
        name: string
        reports: Array<{ id: string; name: string }>
      } | null
      team?: unknown
      jobRole?: {
        id: string
        level: { id: string; name: string }
        domain: { id: string; name: string }
      } | null
      reports?: Array<{ id: string; name: string }>
    }>
    parent?: { id: string; name: string } | null
    children?: Array<{
      id: string
      name: string
      people?: Array<{ id: string; name: string }>
      initiatives?: Array<{ id: string; title: string }>
    }>
    initiatives?: Array<{
      id: string
      title: string
      team?: { id: string; name: string }
    }>
  }

  // Add level field to people to match Person type requirements
  const teamWithLevels = {
    ...team,
    people: team.people.map(person => ({
      ...person,
      level: 0, // Default level, can be calculated based on hierarchy if needed
    })),
  } as typeof team & {
    people: Array<(typeof team.people)[0] & { level: number }>
  }

  return (
    <TeamDetailClient
      teamName={team.name}
      teamId={team.id}
      teamAvatar={team.avatar}
      isAdmin={session.user.role === 'ADMIN'}
    >
      <TeamDetailContent
        team={
          teamWithLevels as unknown as Parameters<
            typeof TeamDetailContent
          >[0]['team']
        }
        isAdmin={session.user.role === 'ADMIN'}
      />
    </TeamDetailClient>
  )
}
