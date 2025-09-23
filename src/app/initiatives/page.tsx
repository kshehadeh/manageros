import { getInitiatives } from '@/lib/actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InitiativesTable } from '@/components/initiatives-table'
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

  const initiatives = await getInitiatives()

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
        <InitiativesTable initiatives={initiatives} />
      </div>
    </div>
  )
}
