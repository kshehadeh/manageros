import { isAdminOrOwner, requireAuth } from '@/lib/auth-utils'
import { Users2, Users, GitBranch } from 'lucide-react'
import { TeamsDataTable } from '@/components/teams/data-table'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { HELP_IDS } from '@/lib/help'
import { TeamsActionsDropdown } from '@/components/teams/teams-actions-dropdown'
import { TeamsViewDropdown } from '@/components/teams/teams-view-dropdown'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'
import { getTeamStatistics } from '@/lib/actions/team'
import { TeamsViewRedirect } from '@/components/teams/teams-view-redirect'

export default async function TeamsPage() {
  const user = await requireAuth({ requireOrganization: true })
  const isAdmin = isAdminOrOwner(user)

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Teams', href: '/teams' },
  ]

  const stats = await getTeamStatistics()

  const subtitle = (
    <>
      <p className='mb-2'>Manage your organization's team structure</p>
      <div className='flex flex-wrap items-center gap-4 text-xs text-muted-foreground'>
        <div className='flex items-center gap-1'>
          <Users2 className='h-3 w-3' />
          <span>
            {stats.totalTeams} team{stats.totalTeams !== 1 ? 's' : ''}
          </span>
        </div>
        <div className='flex items-center gap-1'>
          <Users className='h-3 w-3' />
          <span>
            {stats.totalMembers} member{stats.totalMembers !== 1 ? 's' : ''}
          </span>
        </div>
        <div className='flex items-center gap-1'>
          <GitBranch className='h-3 w-3' />
          <span>
            {stats.totalSubteams} subteam{stats.totalSubteams !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </>
  )

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <TeamsViewRedirect />
      <PageContainer>
        <PageHeader
          title='Teams'
          titleIcon={Users2}
          subtitle={subtitle}
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
            <TeamsDataTable enablePagination={true} limit={100} />
          </PageSection>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
