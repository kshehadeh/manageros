import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InitiativeDataTable } from '@/components/initiatives/data-table'
import { requireAuth } from '@/lib/auth-utils'
import { Rocket } from 'lucide-react'
import { HelpIcon } from '../../components/help-icon'

export default async function InitiativesPage() {
  await requireAuth({ requireOrganization: true })

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
        <InitiativeDataTable enablePagination={true} />
      </div>
    </div>
  )
}
