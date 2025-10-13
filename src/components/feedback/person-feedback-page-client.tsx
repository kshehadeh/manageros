'use client'

import { MessageCircle } from 'lucide-react'
import { FeedbackDataTable } from './data-table'
import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface PersonFeedbackPageClientProps {
  aboutPersonId: string
  personName: string
}

export function PersonFeedbackPageClient({
  aboutPersonId,
  personName,
}: PersonFeedbackPageClientProps) {
  // Set up breadcrumbs with person's name
  usePageBreadcrumbs([
    { name: 'Feedback', href: '/feedback' },
    { name: personName, href: `/people/${aboutPersonId}` },
    {
      name: 'Feedback',
      href: `/feedback/about/${aboutPersonId}`,
    },
  ])

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

      <FeedbackDataTable
        immutableFilters={{
          aboutPersonId: aboutPersonId,
        }}
      />
    </div>
  )
}
