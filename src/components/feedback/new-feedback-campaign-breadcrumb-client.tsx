'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface NewFeedbackCampaignBreadcrumbClientProps {
  personName: string
  personId: string
  children: React.ReactNode
}

export function NewFeedbackCampaignBreadcrumbClient({
  personName,
  personId,
  children,
}: NewFeedbackCampaignBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'People', href: '/people' },
    { name: personName, href: `/people/${personId}` },
    {
      name: 'Feedback Campaigns',
      href: `/people/${personId}/feedback-campaigns`,
    },
    {
      name: 'New Campaign',
      href: `/people/${personId}/feedback-campaigns/new`,
    },
  ])

  return <>{children}</>
}
