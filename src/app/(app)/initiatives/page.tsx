import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { InitiativeDataTable } from '@/components/initiatives/data-table'
import { Rocket, Plus } from 'lucide-react'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'

export default async function InitiativesPage() {
  const user = await getCurrentUser()
  const canCreateInitiatives = await getActionPermission(
    user,
    'initiative.create'
  )

  return (
    <PageContainer>
      <PageHeader
        title='Initiatives'
        titleIcon={Rocket}
        helpId='initiatives'
        subtitle='Manage long-term goals and objectives'
        actions={
          canCreateInitiatives ? (
            <Button asChild className='flex items-center gap-2'>
              <Link href='/initiatives/new'>
                <Plus className='h-4 w-4' />
                Create Initiative
              </Link>
            </Button>
          ) : null
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
