import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Rag } from '@/components/rag'

export default async function Home() {
  const [checkIns, oneOnes] = await Promise.all([
    prisma.checkIn.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { initiative: true }
    }),
    prisma.oneOnOne.findMany({
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
