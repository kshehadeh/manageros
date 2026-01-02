import { TeamsFlowChart } from '@/components/teams/teams-flow-chart'
import { getTeamHierarchyOptimized } from '@/lib/actions/team'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'
import { Users2 } from 'lucide-react'
import { TeamsActionsDropdown } from '@/components/teams/teams-actions-dropdown'
import { TeamsViewDropdown } from '@/components/teams/teams-view-dropdown'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'
import { isAdminOrOwner, requireAuth } from '@/lib/auth-utils'
import { HELP_IDS } from '@/lib/help'

export default async function TeamsFlowPage() {
  const user = await requireAuth({ requireOrganization: true })
  const isAdmin = isAdminOrOwner(user)
  const teams = await getTeamHierarchyOptimized()

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Teams', href: '/teams' },
    { name: 'Organizational Chart', href: '/teams/chart' },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title='Teams'
          titleIcon={Users2}
          subtitle='Interactive team hierarchy visualization'
          helpId={HELP_IDS.peopleTeamsTeams}
          actions={
            <div className='flex flex-wrap items-center gap-3'>
              <TeamsViewDropdown />
              <TeamsActionsDropdown
                canCreateTeam={isAdmin}
                canImportTeam={isAdmin}
                canAddMember={isAdmin}
              />
            </div>
          }
        />
        <PageContent>
          <PageSection>
            <TeamsFlowChart teams={teams} />
          </PageSection>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
