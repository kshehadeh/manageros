import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InitiativeDataTable } from '@/components/initiatives/data-table'
import { Rocket, Plus } from 'lucide-react'
import { HelpIcon } from '../../../components/help-icon'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'

export default function InitiativesPage() {
  return (
    <PageContainer>
      <PageHeader
        title={
          <div className='flex items-center gap-2'>
            Initiatives
            <HelpIcon helpId='initiatives' size='md' />
          </div>
        }
        titleIcon={Rocket}
        actions={
          <Button asChild className='flex items-center gap-2'>
            <Link href='/initiatives/new'>
              <Plus className='h-4 w-4' />
              Create Initiative
            </Link>
          </Button>
        }
      />
      <PageContent>
        <PageSection>
          <InitiativeDataTable enablePagination={true} />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
