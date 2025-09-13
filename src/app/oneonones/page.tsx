import { prisma } from '@/lib/db'

export default async function OneOnOnesPage() {
  const items = await prisma.oneOnOne.findMany({
    orderBy: { scheduledAt: 'asc' },
    include: { report: true }
  })
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">1:1s</h2>
      <div className="grid gap-3">
        {items.map(i => (
          <div key={i.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{i.report.name}</div>
                <div className="text-sm text-neutral-400">{i.cadence ?? ''}</div>
              </div>
              <div className="text-sm text-neutral-400">{i.scheduledAt ? new Date(i.scheduledAt).toLocaleString() : 'TBD'}</div>
            </div>
            {i.agenda && (<div className="mt-2 text-sm"><pre className="whitespace-pre-wrap">{i.agenda}</pre></div>)}
          </div>
        ))}
        {items.length === 0 && <div className="text-neutral-400 text-sm">No 1:1s yet.</div>}
      </div>
    </div>
  )
}
