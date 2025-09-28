import { getInitiatives } from '@/lib/actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InitiativesTable } from '@/components/initiatives-table'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { Rocket } from 'lucide-react'
import { HelpIcon } from '../../components/help-icon'

export default async function InitiativesPage() {
  const user = await requireAuth({ requireOrganization: true })

  const [initiatives, people, teams] = await Promise.all([
    getInitiatives(),
    prisma.person.findMany({
      where: {
        organizationId: user.organizationId!,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.team.findMany({
      where: {
        organizationId: user.organizationId!,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className='page-container px-3 md:px-0'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <Rocket className='h-6 w-6 text-muted-foreground' />
              <h1 className='page-title'>Initiatives</h1>
              <HelpIcon helpId='initiatives' size='md' />
            </div>
          </div>
          <Button asChild variant='outline'>
            <Link href='/initiatives/new'>New Initiative</Link>
          </Button>
        </div>
      </div>
      <div className='page-section -mx-3 md:mx-0'>
        <InitiativesTable
          initiatives={initiatives}
          people={people}
          teams={teams}
        />
      </div>
    </div>
  )
}
