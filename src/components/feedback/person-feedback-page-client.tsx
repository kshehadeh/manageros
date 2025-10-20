'use client'

import { MessageCircle } from 'lucide-react'
import { GenericDataTable } from '@/components/common/generic-data-table'
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
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center gap-3 mb-2'>
          <MessageCircle className='h-6 w-6 text-muted-foreground' />
          <h1 className='page-title'>Feedback for {personName}</h1>
        </div>
        <p className='page-subtitle'>
          View all feedback about {personName}. You can see all public feedback
          and any private feedback you&apos;ve written.
        </p>
      </div>

      <GenericDataTable
        config={feedbackDataTableConfig}
        settingsId={`person-feedback-${aboutPersonId}`}
        immutableFilters={{
          aboutPersonId: aboutPersonId,
        }}
        onRowClick={handleRowClick} // Custom row click behavior
      />
    </div>
  )
}
