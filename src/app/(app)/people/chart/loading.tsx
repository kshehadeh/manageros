import { OrgChartLoading } from '@/components/org-chart-loading'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'
import { Workflow } from 'lucide-react'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader title='Organization Chart' titleIcon={Workflow} />
      <PageContent>
        <PageSection>
          <OrgChartLoading />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
