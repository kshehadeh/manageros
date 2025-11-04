import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InitiativeDataTable } from '@/components/initiatives/data-table'
import { requireAuth } from '@/lib/auth-utils'
import { Rocket, Plus } from 'lucide-react'
import { HelpIcon } from '../../../components/help-icon'
import { PageSection } from '@/components/ui/page-section'

export default async function InitiativesPage() {
  await requireAuth({ requireOrganization: true })

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <Rocket className='h-6 w-6 text-muted-foreground' />
              <h1 className='page-title'>Initiatives</h1>
              <HelpIcon helpId='initiatives' size='md' />
            </div>
          </div>
          <Button asChild className='flex items-center gap-2'>
            <Link href='/initiatives/new'>
              <Plus className='h-4 w-4' />
              Create Initiative
            </Link>
          </Button>
        </div>
      </div>
      <PageSection>
        <InitiativeDataTable enablePagination={true} />
      </PageSection>
    </div>
  )
}
