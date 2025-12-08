import { InitiativeDataTable } from '@/components/initiatives/data-table'
import { Rocket } from 'lucide-react'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
import { InitiativesListActionsDropdown } from '@/components/initiatives/initiatives-list-actions-dropdown'

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
        helpId='tasks-projects/initiatives'
        subtitle='Manage long-term goals and objectives'
        actions={
          <InitiativesListActionsDropdown
            canCreateInitiative={canCreateInitiatives}
          />
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
