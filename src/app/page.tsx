import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Rag } from '@/components/rag'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home () {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // If user doesn't have an organization, show organization creation prompt
  if (!session.user.organizationId) {
    return (
      <div className="space-y-6">
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Welcome to ManagerOS!</h2>
          <p className="text-neutral-400 mb-6">
            To get started, you&apos;ll need to create an organization or be invited to an existing one.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/organization/create" className="btn">
              Create Organization
            </Link>
            <Link href="/teams" className="btn bg-neutral-600 hover:bg-neutral-700">
              Browse Teams
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const [teams, directReports, openInitiatives, recentOneOnes] = await Promise.all([
    // Get all teams (including child teams)
    prisma.team.findMany({
      where: { 
        organizationId: session.user.organizationId!
      },
      orderBy: { name: 'asc' },
      include: {
        people: true,
        initiatives: true,
        parent: true
      }
    }),
    // Get direct reports for the logged-in user
    prisma.person.findMany({
      where: {
        organizationId: session.user.organizationId!,
        manager: {
          user: {
            id: session.user.id
          }
        }
      },
      orderBy: { name: 'asc' },
      include: {
        team: true,
        reports: true
      }
    }),
    // Get open initiatives (not done or canceled)
    prisma.initiative.findMany({
      where: {
        organizationId: session.user.organizationId!,
        status: {
          notIn: ['done', 'canceled']
        }
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        team: true,
        objectives: true,
        _count: { select: { checkIns: true } }
      }
    }),
    // Get recent 1:1s where the logged-in user was either manager or report
    prisma.oneOnOne.findMany({
      where: {
        OR: [
          {
            manager: {
              user: {
                id: session.user.id
              }
            }
          },
          {
            report: {
              user: {
                id: session.user.id
              }
            }
          }
        ]
      },
      orderBy: { scheduledAt: 'desc' },
      take: 5,
      include: {
        manager: {
          include: {
            user: true
          }
        },
        report: {
          include: {
            user: true
          }
        }
      }
    })
  ])

  return (
    <div className="space-y-6">
      {/* Top row with Teams, Direct Reports, and Recent 1:1s */}
      <div className="grid gap-6 md:grid-cols-3">
        <section className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Teams</h2>
            <Link href="/teams" className="text-sm underline">View all</Link>
          </div>
          <div className="space-y-3">
            {teams.map(team => (
              <div key={team.id} className="flex items-center justify-between">
                <div>
                  <Link href={`/teams/${team.id}`} className="font-medium hover:text-blue-400">
                    {team.name}
                  </Link>
                  <div className="text-neutral-400 text-sm">{team.description ?? ''}</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {team.people.length} member{team.people.length !== 1 ? 's' : ''} • {team.initiatives.length} initiative{team.initiatives.length !== 1 ? 's' : ''}
                    {team.parent && (
                      <span> • Parent: <Link href={`/teams/${team.parent.id}`} className="hover:text-blue-400">{team.parent.name}</Link></span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {teams.length === 0 && <div className="text-neutral-400 text-sm">No teams yet.</div>}
          </div>
        </section>

        <section className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Direct Reports</h2>
            <Link href="/people" className="text-sm underline">View all</Link>
          </div>
          <div className="space-y-3">
            {directReports.map(person => (
              <div key={person.id} className="flex items-center justify-between">
                <div>
                  <Link href={`/people/${person.id}`} className="font-medium hover:text-blue-400">
                    {person.name}
                  </Link>
                  <div className="text-neutral-400 text-sm">{person.role ?? ''}</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {person.team?.name && (
                      <span>Team: <Link href={`/teams/${person.team.id}`} className="hover:text-blue-400">{person.team.name}</Link></span>
                    )}
                    {person.reports.length > 0 && (
                      <span> • {person.reports.length} report{person.reports.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                <span className={`badge ${
                  person.status === 'active' ? 'rag-green' : 
                  person.status === 'inactive' ? 'rag-red' : 'rag-amber'
                }`}>
                  {person.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {directReports.length === 0 && <div className="text-neutral-400 text-sm">No direct reports.</div>}
          </div>
        </section>

        <section className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent 1:1s</h2>
            <Link href="/oneonones" className="text-sm underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentOneOnes.map(oneOnOne => (
              <Link key={oneOnOne.id} href={`/oneonones/${oneOnOne.id}`} className="block card hover:bg-neutral-800/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {oneOnOne.manager?.user?.id === session.user.id ? (
                        <span>With <span className="hover:text-blue-400">{oneOnOne.report.name}</span></span>
                      ) : (
                        <span>With <span className="hover:text-blue-400">{oneOnOne.manager.name}</span></span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {oneOnOne.scheduledAt ? new Date(oneOnOne.scheduledAt).toLocaleDateString() : 'TBD'}
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {oneOnOne.manager?.user?.id === session.user.id ? 'Manager' : 'Report'}
                  </div>
                </div>
              </Link>
            ))}
            {recentOneOnes.length === 0 && <div className="text-neutral-400 text-sm">No recent 1:1s.</div>}
          </div>
        </section>
      </div>

      {/* Bottom row with Open Initiatives spanning full width */}
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Open Initiatives</h2>
          <Link href="/initiatives" className="text-sm underline">View all</Link>
        </div>
        <div className="space-y-3">
          {openInitiatives.map(initiative => (
            <div key={initiative.id} className="flex items-center justify-between">
              <div>
                <Link href={`/initiatives/${initiative.id}`} className="font-medium hover:text-blue-400">
                  {initiative.title}
                </Link>
                <div className="text-neutral-400 text-sm">{initiative.summary ?? ''}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  {initiative.objectives.length} objectives • {initiative._count.checkIns} check-ins
                  {initiative.team && (
                    <span> • Team: <Link href={`/teams/${initiative.team.id}`} className="hover:text-blue-400">{initiative.team.name}</Link></span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Rag rag={initiative.rag} />
                <span className="badge">{initiative.confidence}%</span>
              </div>
            </div>
          ))}
          {openInitiatives.length === 0 && <div className="text-neutral-400 text-sm">No open initiatives.</div>}
        </div>
      </section>
    </div>
  )
}
