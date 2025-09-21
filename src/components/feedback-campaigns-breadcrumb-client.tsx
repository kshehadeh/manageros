'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface FeedbackCampaignsBreadcrumbClientProps {
  personName: string
  personId: string
  children: React.ReactNode
}

export function FeedbackCampaignsBreadcrumbClient({
  personName,
  personId,
  children,
}: FeedbackCampaignsBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'People', href: '/people' },
    { name: personName, href: `/people/${personId}` },
    {
      name: 'Feedback Campaigns',
      href: `/people/${personId}/feedback-campaigns`,
    },
  ])

  return <>{children}</>
}
