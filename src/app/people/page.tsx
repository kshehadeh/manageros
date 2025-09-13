import { prisma } from '@/lib/db'

export default async function PeoplePage() {
  const people = await prisma.person.findMany({ orderBy: { name: 'asc' } })
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">People</h2>
      <div className="grid gap-3">
        {people.map(p => (
          <div key={p.id} className="card">
            <div className="font-medium">{p.name}</div>
            <div className="text-sm text-neutral-400">{p.role ?? ''}</div>
            <div className="text-xs text-neutral-500">{p.email}</div>
          </div>
        ))}
        {people.length === 0 && <div className="text-neutral-400 text-sm">No people yet.</div>}
      </div>
    </div>
  )
}
