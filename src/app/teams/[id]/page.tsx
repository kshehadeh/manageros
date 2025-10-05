import { prisma } from '@/lib/db'
import { TeamDetailClient } from '@/components/teams/team-detail-client'
import { TeamDetailContent } from '@/components/teams/team-detail-content'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

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
  const team = await prisma.team.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      parent: true,
      children: {
        include: {
          people: true,
          initiatives: true,
        },
        orderBy: { name: 'asc' },
      },
      people: {
        include: {
          manager: {
            include: {
              reports: true,
            },
          },
          team: true,
          jobRole: {
            include: {
              level: true,
              domain: true,
            },
          },
          reports: true,
        },
        orderBy: { name: 'asc' },
      },
      initiatives: {
        include: {
          objectives: true,
          team: true,
          owners: {
            include: {
              person: true,
            },
          },
          tasks: {
            select: {
              status: true,
            },
          },
          _count: { select: { checkIns: true, tasks: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })

  // Get all people and teams for the InitiativesTable component
  const [allPeople, allTeams] = await Promise.all([
    prisma.person.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.team.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!team) {
    notFound()
  }

  // Add level field to people to match Person type requirements
  const teamWithLevels = {
    ...team,
    people: team.people.map(person => ({
      ...person,
      level: 0, // Default level, can be calculated based on hierarchy if needed
    })),
  }

  return (
    <TeamDetailClient
      teamName={team.name}
      teamId={team.id}
      teamAvatar={team.avatar}
      isAdmin={session.user.role === 'ADMIN'}
    >
      <TeamDetailContent
        team={teamWithLevels}
        allPeople={allPeople}
        allTeams={allTeams}
        isAdmin={session.user.role === 'ADMIN'}
      />
    </TeamDetailClient>
  )
}
