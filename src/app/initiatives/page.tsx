import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Rag } from '@/components/rag'
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
      _count: { select: { checkIns: true } },
    },
  })

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Initiatives</h2>
        <Button asChild variant='outline'>
          <Link href='/initiatives/new'>New</Link>
        </Button>
      </div>
      <div className='grid gap-3'>
        {inits.map(i => (
          <Link
            key={i.id}
            href={`/initiatives/${i.id}`}
            className='card hover:bg-neutral-800/60'
          >
            <div className='flex items-center justify-between'>
              <div>
                <div className='font-semibold'>{i.title}</div>
                <div className='text-sm text-neutral-400'>
                  {i.summary ?? ''}
                </div>
                <div className='text-xs text-neutral-500 mt-2'>
                  {i.objectives.length} objectives · {i._count.checkIns}{' '}
                  check-ins
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Rag rag={i.rag} />
                <span className='badge'>{i.confidence}%</span>
              </div>
            </div>
          </Link>
        ))}
        {inits.length === 0 && (
          <div className='text-neutral-400 text-sm'>No initiatives yet.</div>
        )}
      </div>
    </div>
  )
}
