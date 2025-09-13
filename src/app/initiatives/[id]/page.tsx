import { prisma } from '@/lib/db'
import { Rag } from '@/components/rag'
import Link from 'next/link'

export default async function InitiativeDetail({ params }: { params: { id: string } }) {
  const init = await prisma.initiative.findUnique({
    where: { id: params.id },
    include: { 
      objectives: { include: { tasks: true } }, 
      checkIns: { orderBy: { createdAt: 'desc' } },
      team: true,
      owners: {
        include: {
          person: true,
        },
      },
    }
  })

  if (!init) return <div>Not found</div>

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{init.title}</h2>
            <p className="text-neutral-400">{init.summary ?? ''}</p>
            <div className="text-xs text-neutral-500 mt-2">
              {init.team && (
                <span>Team: <Link href={`/teams/${init.team.id}`} className="hover:text-blue-400">{init.team.name}</Link></span>
              )}
              {init.owners.length > 0 && (
                <span>
                  {init.team && ' • '}
                  Owners: {init.owners.map((owner, index) => (
                    <span key={owner.person.id}>
                      <Link href={`/people/${owner.person.id}`} className="hover:text-blue-400">
                        {owner.person.name}
                      </Link>
                      {index < init.owners.length - 1 && ', '}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Rag rag={init.rag} />
            <span className="badge">{init.confidence}%</span>
          </div>
        </div>
      </div>

      <section className="card">
        <h3 className="font-semibold mb-3">Objectives & Tasks</h3>
        <div className="space-y-4">
          {init.objectives.map(o => (
            <div key={o.id} className="space-y-2">
              <div className="font-medium">{o.title}</div>
              <ul className="text-sm list-disc ml-5">
                {o.tasks.map(t => (
                  <li key={t.id}>{t.title} <span className="text-neutral-500">({t.status})</span></li>
                ))}
                {o.tasks.length === 0 && <li className="text-neutral-500">No tasks</li>}
              </ul>
            </div>
          ))}
          {init.objectives.length === 0 && <div className="text-neutral-400 text-sm">No objectives yet.</div>}
        </div>
      </section>

      <section className="card">
        <h3 className="font-semibold mb-3">Recent Check-ins</h3>
        <div className="space-y-3">
          {init.checkIns.map(ci => (
            <div key={ci.id} className="border border-neutral-800 rounded-xl p-3">
              <div className="text-sm text-neutral-400">{new Date(ci.createdAt).toLocaleString()}</div>
              <div className="mt-1">{ci.summary}</div>
            </div>
          ))}
          {init.checkIns.length === 0 && <div className="text-neutral-400 text-sm">No check-ins yet.</div>}
        </div>
      </section>
    </div>
  )
}
