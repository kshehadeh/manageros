'use client'

import { GenericDataTable } from '@/components/common/generic-data-table'
import { feedbackCampaignsDataTableConfig } from './feedback-campaigns-data-table-config'
import { PageSection } from '@/components/ui/page-section'

export function FeedbackCampaignsPageClient() {
  return (
    <PageSection>
      <GenericDataTable
        config={feedbackCampaignsDataTableConfig}
        settingsId='feedback-campaigns-main'
        enablePagination={true}
        limit={20}
      />
    </PageSection>
  )
}
