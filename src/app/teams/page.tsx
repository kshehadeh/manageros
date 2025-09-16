import { prisma } from '@/lib/db'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Team, Person, Initiative } from '@prisma/client'

type TeamWithChildren = Team & {
  parent?: { id: string; name: string } | null
  children?: TeamWithChildren[]
  people: Person[]
  initiatives: Initiative[]
}

function TeamCard({
  team,
  _level = 0,
}: {
  team: TeamWithChildren
  _level?: number
}) {
  return (
    <div className='card'>
      {/* Main team info */}
      <div className='flex items-center justify-between'>
        <div>
          <Link
            href={`/teams/${team.id}`}
            className='font-medium hover:text-blue-400'
          >
            {team.name}
          </Link>
          <div className='text-sm text-neutral-400'>
            {team.description ?? ''}
          </div>
          <div className='text-xs text-neutral-500 mt-1'>
            {team.people.length} member{team.people.length !== 1 ? 's' : ''} •{' '}
            {team.initiatives.length} initiative
            {team.initiatives.length !== 1 ? 's' : ''}
            {team.children && team.children.length > 0 && (
              <span className='ml-2 text-blue-400'>
                • {team.children.length} child team
                {team.children.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Link href={`/people/new?teamId=${team.id}`} className='btn text-sm'>
            Add Person
          </Link>
          <Link href={`/teams/new?parentId=${team.id}`} className='btn text-sm'>
            Add Child
          </Link>
          <Link href={`/teams/${team.id}/edit`} className='btn text-sm'>
            Edit
          </Link>
        </div>
      </div>

      {/* Child teams nested within the card */}
      {team.children && team.children.length > 0 && (
        <div className='mt-4 pt-4 border-t border-neutral-700'>
          <div className='text-xs text-neutral-500 mb-3 font-medium'>
            Child Teams:
          </div>
          <div className='space-y-3'>
            {team.children.map(child => (
              <div
                key={child.id}
                className='bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50'
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <Link
                      href={`/teams/${child.id}`}
                      className='font-medium hover:text-blue-400 text-sm'
                    >
                      {child.name}
                    </Link>
                    <div className='text-xs text-neutral-400 mt-1'>
                      {child.description ?? ''}
                    </div>
                    <div className='text-xs text-neutral-500 mt-1'>
                      {child.people.length} member
                      {child.people.length !== 1 ? 's' : ''} •{' '}
                      {child.initiatives.length} initiative
                      {child.initiatives.length !== 1 ? 's' : ''}
                      {child.children && child.children.length > 0 && (
                        <span className='ml-2 text-blue-400'>
                          • {child.children.length} child team
                          {child.children.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Link
                      href={`/people/new?teamId=${child.id}`}
                      className='btn text-xs'
                    >
                      Add Person
                    </Link>
                    <Link
                      href={`/teams/new?parentId=${child.id}`}
                      className='btn text-xs'
                    >
                      Add Child
                    </Link>
                    <Link
                      href={`/teams/${child.id}/edit`}
                      className='btn text-xs'
                    >
                      Edit
                    </Link>
                  </div>
                </div>

                {/* Grandchild teams (nested one level deeper) */}
                {child.children && child.children.length > 0 && (
                  <div className='mt-3 pt-3 border-t border-neutral-600/50'>
                    <div className='text-xs text-neutral-500 mb-2 font-medium'>
                      Sub-teams:
                    </div>
                    <div className='space-y-2'>
                      {child.children.map(grandchild => (
                        <div
                          key={grandchild.id}
                          className='bg-neutral-700/50 rounded p-2 border border-neutral-600/30'
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <Link
                                href={`/teams/${grandchild.id}`}
                                className='font-medium hover:text-blue-400 text-xs'
                              >
                                {grandchild.name}
                              </Link>
                              <div className='text-xs text-neutral-400 mt-1'>
                                {grandchild.description ?? ''}
                              </div>
                              <div className='text-xs text-neutral-500 mt-1'>
                                {grandchild.people.length} member
                                {grandchild.people.length !== 1
                                  ? 's'
                                  : ''} • {grandchild.initiatives.length}{' '}
                                initiative
                                {grandchild.initiatives.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <div className='flex items-center gap-1'>
                              <Link
                                href={`/people/new?teamId=${grandchild.id}`}
                                className='btn text-xs'
                              >
                                Add Person
                              </Link>
                              <Link
                                href={`/teams/${grandchild.id}/edit`}
                                className='btn text-xs'
                              >
                                Edit
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default async function TeamsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const teams = await prisma.team.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: 'asc' },
    include: {
      people: true,
      initiatives: true,
      parent: true,
      children: {
        include: {
          people: true,
          initiatives: true,
          children: {
            include: {
              people: true,
              initiatives: true,
              children: {
                include: {
                  people: true,
                  initiatives: true,
                },
                orderBy: { name: 'asc' },
              },
            },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
  })

  // Filter to only show top-level teams (no parent)
  const topLevelTeams = teams.filter(team => !team.parentId)

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold'>Teams</h2>
          <p className='text-sm text-neutral-400 mt-1'>
            Team hierarchy with child teams nested under their parents
          </p>
        </div>
        <Link href='/teams/new' className='btn'>
          New Team
        </Link>
      </div>
      <div className='space-y-3'>
        {topLevelTeams.map(team => (
          <TeamCard key={team.id} team={team} />
        ))}
        {topLevelTeams.length === 0 && (
          <div className='text-neutral-400 text-sm text-center py-8'>
            No teams yet.{' '}
            <Link
              href='/teams/new'
              className='text-blue-400 hover:text-blue-300'
            >
              Create your first team
            </Link>
            .
          </div>
        )}
      </div>
    </div>
  )
}
