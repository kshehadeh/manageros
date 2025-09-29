import { prisma } from '@/lib/db'
import Link from 'next/link'
import { TeamDetailClient } from '@/components/team-detail-client'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TeamActionsDropdown } from '@/components/team-actions-dropdown'
import { Users2, User, Rocket, Building2 } from 'lucide-react'
import { PeopleTable } from '@/components/people-table'
import { InitiativesTable } from '@/components/initiatives-table'
import { TeamChildTeamsTable } from '../../../components/team-child-teams-table'

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

  // Compute level field for people (needed by PeopleTable component)
  const peopleWithLevel = team.people.map(person => ({
    ...person,
    level: 0, // For team members, we'll use level 0 since they're all at the same level
  }))

  return (
    <TeamDetailClient teamName={team.name} teamId={team.id}>
      <div className='px-4 lg:px-6'>
        <div className='page-header'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <Users2 className='h-6 w-6 text-muted-foreground' />
                <h1 className='page-title'>{team.name}</h1>
              </div>
              {team.description && (
                <p className='page-section-subtitle'>{team.description}</p>
              )}
              {team.parent && (
                <div className='text-sm text-muted-foreground mt-1'>
                  Parent team:{' '}
                  <Link
                    href={`/teams/${team.parent.id}`}
                    className='link-hover'
                  >
                    {team.parent.name}
                  </Link>
                </div>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <TeamActionsDropdown teamId={team.id} />
            </div>
          </div>
        </div>

        <div className='space-y-6'>
          {/* Team Members */}
          <div className='page-section'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='section-header font-bold flex items-center gap-2'>
                <User className='w-4 h-4' />
                Team Members ({team.people.length})
              </h3>
              <Button asChild variant='outline' size='sm'>
                <Link href={`/people/new?teamId=${team.id}`}>Add Member</Link>
              </Button>
            </div>
            <PeopleTable people={peopleWithLevel} />
          </div>

          {/* Team Initiatives */}
          <div className='page-section'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='section-header font-bold flex items-center gap-2'>
                <Rocket className='w-4 h-4' />
                Team Initiatives ({team.initiatives.length})
              </h3>
              <Button asChild variant='outline' size='sm'>
                <Link href={`/initiatives/new?teamId=${team.id}`}>
                  New Initiative
                </Link>
              </Button>
            </div>
            <InitiativesTable
              initiatives={team.initiatives}
              people={allPeople}
              teams={allTeams}
              hideFilters={true}
            />
          </div>

          {/* Child Teams */}
          <div className='page-section'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='section-header font-bold flex items-center gap-2'>
                <Building2 className='w-4 h-4' />
                Child Teams ({team.children.length})
              </h3>
              <Button asChild variant='outline' size='sm'>
                <Link href={`/teams/new?parentId=${team.id}`}>
                  Add Child Team
                </Link>
              </Button>
            </div>
            <TeamChildTeamsTable childTeams={team.children} />
          </div>
        </div>
      </div>
    </TeamDetailClient>
  )
}
