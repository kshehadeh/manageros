import { getInitiatives } from '@/lib/actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InitiativesTable } from '@/components/initiatives-table'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export default async function InitiativesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const [initiatives, people, teams] = await Promise.all([
    getInitiatives(),
    prisma.person.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.team.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { name: 'asc' },
    }),
  ])

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
        <InitiativesTable
          initiatives={initiatives}
          people={people}
          teams={teams}
        />
      </div>
    </div>
  )
}
