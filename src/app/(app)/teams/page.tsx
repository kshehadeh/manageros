import { isAdminOrOwner, requireAuth } from '@/lib/auth-utils'
import { Users2 } from 'lucide-react'
import { TeamsDataTable } from '@/components/teams/data-table'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { HELP_IDS } from '@/lib/help'
import { TeamsActionsDropdown } from '@/components/teams/teams-actions-dropdown'
import { TeamsViewDropdown } from '@/components/teams/teams-view-dropdown'

export default async function TeamsPage() {
  const user = await requireAuth({ requireOrganization: true })
  const isAdmin = isAdminOrOwner(user)

  return (
    <PageContainer>
      <PageHeader
        title='Teams'
        titleIcon={Users2}
        subtitle="Manage your organization's team structure"
        helpId={HELP_IDS.peopleTeamsTeams}
        actions={
          <div className='flex flex-wrap items-center gap-3'>
            <TeamsViewDropdown />
            <TeamsActionsDropdown
              canCreateTeam={isAdmin}
              canImportTeam={isAdmin}
            />
          </div>
        }
      />
      <PageContent>
        <PageSection>
          <TeamsDataTable enablePagination={true} limit={100} />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
