import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Rag } from '@/components/rag'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
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
            To get started, you'll need to create an organization or be invited to an existing one.
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

  const [checkIns, oneOnes] = await Promise.all([
    prisma.checkIn.findMany({
      where: {
        initiative: {
          organizationId: session.user.organizationId!
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { initiative: true }
    }),
    prisma.oneOnOne.findMany({
      where: {
        report: {
          organizationId: session.user.organizationId!
        }
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      include: { report: true }
    })
  ])

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent Check-ins</h2>
          <Link href="/initiatives" className="text-sm underline">View all</Link>
        </div>
        <div className="space-y-3">
          {checkIns.map(ci => (
            <div key={ci.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{ci.initiative.title}</div>
                <div className="text-neutral-400 text-sm">{ci.summary}</div>
              </div>
              <div className="flex items-center gap-2">
                <Rag rag={ci.rag} />
                <span className="badge">{ci.confidence}%</span>
              </div>
            </div>
          ))}
          {checkIns.length === 0 && <div className="text-neutral-400 text-sm">No check-ins yet.</div>}
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Upcoming 1:1s</h2>
          <Link href="/oneonones" className="text-sm underline">View all</Link>
        </div>
        <div className="space-y-3">
          {oneOnes.map(o => (
            <div key={o.id} className="flex items-center justify-between">
              <div>
                <Link href={`/people/${o.report.id}`} className="font-medium hover:text-blue-400">
                  {o.report.name}
                </Link>
                <div className="text-neutral-400 text-sm">{o.cadence ?? ''}</div>
              </div>
              <div className="badge">{o.scheduledAt ? new Date(o.scheduledAt).toLocaleString() : 'TBD'}</div>
            </div>
          ))}
          {oneOnes.length === 0 && <div className="text-neutral-400 text-sm">No 1:1s scheduled.</div>}
        </div>
      </section>
    </div>
  )
}
