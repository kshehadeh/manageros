import { getPeopleHierarchy } from '@/lib/actions/person'
import { OrgChartReactFlow } from '@/components/org-chart-reactflow'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'
import { Workflow } from 'lucide-react'

export default async function PeopleChartPage() {
  const people = await getPeopleHierarchy()

  return (
    <PageContainer>
      <PageHeader
        title='Organization Chart'
        titleIcon={Workflow}
        helpId='people-hierarchy'
      />
      <PageContent>
        <PageSection>
          <OrgChartReactFlow people={people} />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
