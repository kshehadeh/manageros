import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InitiativeCard } from '@/components/initiative-card'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function InitiativesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const inits = await prisma.initiative.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { updatedAt: 'desc' },
    include: {
      objectives: true,
      team: true,
      _count: { select: { checkIns: true } },
    },
  })

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='page-title'>Initiatives</h1>
          </div>
          <Button asChild variant='outline'>
            <Link href='/initiatives/new'>New Initiative</Link>
          </Button>
        </div>
      </div>
      <div className='page-section'>
        <div className='flex flex-col gap-3'>
          {inits.map(initiative => (
            <InitiativeCard
              key={initiative.id}
              initiative={initiative}
              variant='default'
              showTeam={true}
              showOwners={false}
            />
          ))}
          {inits.length === 0 && (
            <div className='text-muted-foreground text-sm'>
              No initiatives yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
