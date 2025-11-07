'use client'

import { MessageCircle } from 'lucide-react'
import { GenericDataTable } from '@/components/common/generic-data-table'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { feedbackDataTableConfig } from './data-table-config'
import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'
import { useRouter } from 'next/navigation'

interface PersonFeedbackPageClientProps {
  aboutPersonId: string
  personName: string
}

export function PersonFeedbackPageClient({
  aboutPersonId,
  personName,
}: PersonFeedbackPageClientProps) {
  const router = useRouter()

  // Set up breadcrumbs with person's name
  usePageBreadcrumbs([
    { name: 'Feedback', href: '/feedback' },
    { name: personName, href: `/people/${aboutPersonId}` },
    {
      name: 'Feedback',
      href: `/feedback/about/${aboutPersonId}`,
    },
  ])

  // Custom row click handler - could open a dialog, navigate to detail page, etc.
  const handleRowClick = (feedbackId: string) => {
    // Example: Navigate to a feedback detail page
    router.push(`/feedback/${feedbackId}`)

    // Or you could:
    // - Open a dialog/modal
    // - Show a sidebar
    // - Perform any other custom action
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Feedback for ${personName}`}
        titleIcon={MessageCircle}
        subtitle={`View all feedback about ${personName}. You can see all public feedback and any private feedback you've written.`}
      />

      <PageContent>
        <GenericDataTable
          config={feedbackDataTableConfig}
          settingsId={`person-feedback-${aboutPersonId}`}
          immutableFilters={{
            aboutPersonId: aboutPersonId,
          }}
          onRowClick={handleRowClick} // Custom row click behavior
        />
      </PageContent>
    </PageContainer>
  )
}
