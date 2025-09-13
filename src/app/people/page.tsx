import { prisma } from '@/lib/db'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function PeoplePage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const people = await prisma.person.findMany({ 
    where: { organizationId: session.user.organizationId },
    orderBy: { name: 'asc' },
    include: {
      team: true,
      manager: true,
    }
  })
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">People</h2>
        <Link href="/people/new" className="btn">New</Link>
      </div>
      <div className="grid gap-3">
        {people.map(p => (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <Link href={`/people/${p.id}`} className="font-medium hover:text-blue-400">
                  {p.name}
                </Link>
                <div className="text-sm text-neutral-400">{p.role ?? ''}</div>
                <div className="text-xs text-neutral-500">{p.email}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  {p.team?.name && (
                    <span>Team: <Link href={`/teams/${p.team.id}`} className="hover:text-blue-400">{p.team.name}</Link></span>
                  )}
                  {p.manager && (
                    <span> • Manager: <Link href={`/people/${p.manager.id}`} className="hover:text-blue-400">{p.manager.name}</Link></span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${
                  p.status === 'active' ? 'rag-green' : 
                  p.status === 'inactive' ? 'rag-red' : 'rag-amber'
                }`}>
                  {p.status.replace('_', ' ')}
                </span>
                <Link href={`/people/${p.id}/edit`} className="btn text-sm">
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
        {people.length === 0 && <div className="text-neutral-400 text-sm">No people yet.</div>}
      </div>
    </div>
  )
}
