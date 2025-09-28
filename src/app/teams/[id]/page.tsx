import { prisma } from '@/lib/db'
import Link from 'next/link'
import { TeamDetailClient } from '@/components/team-detail-client'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TeamActionsDropdown } from '@/components/team-actions-dropdown'
import { Users2 } from 'lucide-react'
import { TeamMembersTable } from '../../../components/team-members-table'
import { TeamInitiativesTable } from '../../../components/team-initiatives-table'
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
          manager: true,
        },
        orderBy: { name: 'asc' },
      },
      initiatives: {
        include: {
          objectives: true,
          owners: {
            include: {
              person: true,
            },
          },
          _count: { select: { checkIns: true, tasks: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })

  if (!team) {
    notFound()
  }

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
              <h3 className='section-header'>
                Team Members ({team.people.length})
              </h3>
              <Button asChild variant='outline' size='sm'>
                <Link href={`/people/new?teamId=${team.id}`}>Add Member</Link>
              </Button>
            </div>
            <TeamMembersTable people={team.people} />
          </div>

          {/* Team Initiatives */}
          <div className='page-section'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='section-header'>
                Team Initiatives ({team.initiatives.length})
              </h3>
              <Button asChild variant='outline' size='sm'>
                <Link href={`/initiatives/new?teamId=${team.id}`}>
                  New Initiative
                </Link>
              </Button>
            </div>
            <TeamInitiativesTable initiatives={team.initiatives} />
          </div>

          {/* Child Teams */}
          <div className='page-section'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='section-header'>
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
