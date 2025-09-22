import { prisma } from '@/lib/db'
import Link from 'next/link'
import { TeamDetailClient } from '@/components/team-detail-client'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { EditIconButton } from '@/components/edit-icon-button'
import { Button } from '@/components/ui/button'
import { PersonListItemCard } from '@/components/person-list-item-card'
import { TeamCard } from '@/components/team-card'
import { InitiativeCard } from '@/components/initiative-card'

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
          _count: { select: { checkIns: true } },
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
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='page-title'>{team.name}</h1>
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
              <EditIconButton
                href={`/teams/${team.id}/edit`}
                variant='outline'
                size='default'
              />
            </div>
          </div>
        </div>

        <div className='card-grid'>
          {/* Team Members */}
          <section className='card'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-semibold'>
                Team Members ({team.people.length})
              </h3>
              <Button asChild variant='outline' size='sm'>
                <Link href={`/people/new?teamId=${team.id}`}>Add Member</Link>
              </Button>
            </div>
            <div className='space-y-3'>
              {team.people.map(person => (
                <PersonListItemCard
                  key={person.id}
                  person={person}
                  variant='simple'
                  showActions={false}
                />
              ))}
              {team.people.length === 0 && (
                <div className='text-neutral-400 text-sm text-center py-4'>
                  No team members yet.
                </div>
              )}
            </div>
          </section>

          {/* Team Initiatives */}
          <section className='card'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-semibold'>
                Team Initiatives ({team.initiatives.length})
              </h3>
              <Button asChild variant='outline' size='sm'>
                <Link href={`/initiatives/new?teamId=${team.id}`}>
                  New Initiative
                </Link>
              </Button>
            </div>
            <div className='space-y-3'>
              {team.initiatives.map(initiative => (
                <InitiativeCard
                  key={initiative.id}
                  initiative={initiative}
                  variant='default'
                  showTeam={false}
                  showOwners={true}
                  className='border rounded-xl p-3'
                />
              ))}
              {team.initiatives.length === 0 && (
                <div className='text-neutral-400 text-sm text-center py-4'>
                  No initiatives yet.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Child Teams */}
        <section className='card'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold'>
              Child Teams ({team.children.length})
            </h3>
            <Button asChild variant='outline' size='sm'>
              <Link href={`/teams/new?parentId=${team.id}`}>
                Add Child Team
              </Link>
            </Button>
          </div>
          <div className='space-y-3'>
            {team.children.map(childTeam => (
              <TeamCard
                key={childTeam.id}
                team={childTeam}
                variant='simple'
                showActions={true}
              />
            ))}
            {team.children.length === 0 && (
              <div className='text-neutral-400 text-sm text-center py-4'>
                No child teams yet.{' '}
                <Link
                  href={`/teams/new?parentId=${team.id}`}
                  className='text-blue-400 hover:text-blue-300'
                >
                  Create the first child team
                </Link>
                .
              </div>
            )}
          </div>
        </section>

        {/* Team Statistics */}
        <section className='card'>
          <h3 className='font-semibold mb-4'>Team Statistics</h3>
          <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold'>{team.people.length}</div>
              <div className='text-sm text-neutral-400'>Members</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold'>
                {team.initiatives.length}
              </div>
              <div className='text-sm text-neutral-400'>Initiatives</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold'>{team.children.length}</div>
              <div className='text-sm text-neutral-400'>Child Teams</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold'>
                {team.people.filter(p => p.status === 'active').length}
              </div>
              <div className='text-sm text-neutral-400'>Active Members</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold'>
                {
                  team.initiatives.filter(i => i.status === 'in_progress')
                    .length
                }
              </div>
              <div className='text-sm text-neutral-400'>Active Initiatives</div>
            </div>
          </div>
        </section>
      </div>
    </TeamDetailClient>
  )
}
