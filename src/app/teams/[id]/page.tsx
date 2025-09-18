import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Rag } from '@/components/rag'
import { TeamDetailClient } from '@/components/team-detail-client'
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
          manager: true,
        },
        orderBy: { name: 'asc' },
      },
      initiatives: {
        include: {
          owners: {
            include: {
              person: true,
            },
          },
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
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold'>{team.name}</h2>
            {team.description && (
              <p className='text-sm text-neutral-400 mt-1'>
                {team.description}
              </p>
            )}
            {team.parent && (
              <div className='text-sm text-neutral-500 mt-1'>
                Parent team:{' '}
                <Link
                  href={`/teams/${team.parent.id}`}
                  className='hover:text-blue-400'
                >
                  {team.parent.name}
                </Link>
              </div>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Link href={`/teams/${team.id}/edit`} className='btn'>
              Edit Team
            </Link>
            <Link href='/teams' className='btn'>
              Back to Teams
            </Link>
          </div>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          {/* Team Members */}
          <section className='card'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-semibold'>
                Team Members ({team.people.length})
              </h3>
              <Link
                href={`/people/new?teamId=${team.id}`}
                className='btn text-sm'
              >
                Add Member
              </Link>
            </div>
            <div className='space-y-3'>
              {team.people.map(person => (
                <div
                  key={person.id}
                  className='border border-neutral-800 rounded-xl p-3'
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <Link
                        href={`/people/${person.id}`}
                        className='font-medium hover:text-blue-400'
                      >
                        {person.name}
                      </Link>
                      <div className='text-sm text-neutral-400'>
                        {person.role ?? ''}
                      </div>
                      <div className='text-xs text-neutral-500'>
                        {person.email}
                      </div>
                      {person.manager && (
                        <div className='text-xs text-neutral-500 mt-1'>
                          Reports to:{' '}
                          <Link
                            href={`/people/${person.manager.id}`}
                            className='hover:text-blue-400'
                          >
                            {person.manager.name}
                          </Link>
                        </div>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`badge ${
                          person.status === 'active'
                            ? 'rag-green'
                            : person.status === 'inactive'
                              ? 'rag-red'
                              : 'rag-amber'
                        }`}
                      >
                        {person.status.replace('_', ' ')}
                      </span>
                      <Link
                        href={`/people/${person.id}/edit`}
                        className='btn text-sm'
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
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
              <Link
                href={`/initiatives/new?teamId=${team.id}`}
                className='btn text-sm'
              >
                New Initiative
              </Link>
            </div>
            <div className='space-y-3'>
              {team.initiatives.map(initiative => (
                <Link
                  key={initiative.id}
                  href={`/initiatives/${initiative.id}`}
                  className='block border border-neutral-800 rounded-xl p-3 hover:bg-neutral-800/60'
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium'>{initiative.title}</div>
                      <div className='text-sm text-neutral-400'>
                        {initiative.summary ?? ''}
                      </div>
                      <div className='text-xs text-neutral-500 mt-1'>
                        {initiative.owners.length > 0 && (
                          <span>
                            Owners:{' '}
                            {initiative.owners.map((owner, index) => (
                              <span key={owner.person.id}>
                                <Link
                                  href={`/people/${owner.person.id}`}
                                  className='hover:text-blue-400'
                                >
                                  {owner.person.name}
                                </Link>
                                {index < initiative.owners.length - 1 && ', '}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Rag rag={initiative.rag} />
                      <span className='badge'>{initiative.confidence}%</span>
                    </div>
                  </div>
                </Link>
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
            <Link
              href={`/teams/new?parentId=${team.id}`}
              className='btn text-sm'
            >
              Add Child Team
            </Link>
          </div>
          <div className='space-y-3'>
            {team.children.map(childTeam => (
              <Link
                key={childTeam.id}
                href={`/teams/${childTeam.id}`}
                className='block border border-neutral-800 rounded-xl p-3 hover:bg-neutral-800/60'
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='font-medium'>{childTeam.name}</div>
                    <div className='text-sm text-neutral-400'>
                      {childTeam.description ?? ''}
                    </div>
                    <div className='text-xs text-neutral-500 mt-1'>
                      {childTeam.people.length} member
                      {childTeam.people.length !== 1 ? 's' : ''} •{' '}
                      {childTeam.initiatives.length} initiative
                      {childTeam.initiatives.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Link
                      href={`/teams/${childTeam.id}/edit`}
                      className='btn text-sm'
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </Link>
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
