import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { MessageSquare } from 'lucide-react'
import { FeedbackCampaignsPageClient } from '@/components/feedback/feedback-campaigns-page-client'
import { FeedbackCampaignsListActionsDropdown } from '@/components/feedback/feedback-campaigns-list-actions-dropdown'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

export default async function FeedbackCampaignsPage() {
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Feedback 360', href: '/feedback-campaigns' },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title='Feedback 360'
          titleIcon={MessageSquare}
          helpId='feedback-development/feedback-360-campaigns'
          subtitle='Manage Feedback 360 campaigns across your organization'
          actions={<FeedbackCampaignsListActionsDropdown />}
        />

        <PageContent>
          <FeedbackCampaignsPageClient />
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
