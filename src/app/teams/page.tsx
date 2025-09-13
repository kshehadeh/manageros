import { prisma } from '@/lib/db'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function TeamsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const teams = await prisma.team.findMany({ 
    where: { organizationId: session.user.organizationId },
    orderBy: { name: 'asc' },
    include: {
      people: true,
      initiatives: true,
    }
  })
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Teams</h2>
        <Link href="/teams/new" className="btn">New</Link>
      </div>
      <div className="grid gap-3">
        {teams.map(team => (
          <div key={team.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <Link href={`/teams/${team.id}`} className="font-medium hover:text-blue-400">
                  {team.name}
                </Link>
                <div className="text-sm text-neutral-400">{team.description ?? ''}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  {team.people.length} member{team.people.length !== 1 ? 's' : ''} • {team.initiatives.length} initiative{team.initiatives.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/teams/${team.id}/edit`} className="btn text-sm">
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
        {teams.length === 0 && <div className="text-neutral-400 text-sm">No teams yet.</div>}
      </div>
    </div>
  )
}
