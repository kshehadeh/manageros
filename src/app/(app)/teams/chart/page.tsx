import { TeamsFlowChart } from '@/components/teams/teams-flow-chart'
import { getTeamHierarchyOptimized } from '@/lib/actions/team'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'
import { Workflow } from 'lucide-react'

export default async function TeamsFlowPage() {
  const teams = await getTeamHierarchyOptimized()

  return (
    <PageContainer>
      <PageHeader
        title='Team Hierarchy'
        titleIcon={Workflow}
        subtitle='Interactive team hierarchy visualization'
      />
      <PageContent>
        <PageSection>
          <TeamsFlowChart teams={teams} />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
