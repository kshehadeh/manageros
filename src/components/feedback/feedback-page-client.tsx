'use client'

import { MessageCircle } from 'lucide-react'
import { GenericDataTable } from '@/components/common/generic-data-table'
import { feedbackDataTableConfig } from './data-table-config'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'

export function FeedbackPageClient() {
  return (
    <PageContainer>
      <PageHeader
        title='Feedback'
        titleIcon={MessageCircle}
        subtitle='View and filter feedback across your organization. You can see all public feedback and any private feedback you&asp;ve written.'
      />

      <PageContent>
        <GenericDataTable
          config={feedbackDataTableConfig}
          settingsId='feedback-main'
        />
      </PageContent>
    </PageContainer>
  )
}
