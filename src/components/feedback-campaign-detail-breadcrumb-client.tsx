'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface FeedbackCampaignDetailBreadcrumbClientProps {
  personName: string
  personId: string
  campaignTitle: string
  campaignId: string
  children: React.ReactNode
}

export function FeedbackCampaignDetailBreadcrumbClient({
  personName,
  personId,
  campaignTitle,
  campaignId,
  children,
}: FeedbackCampaignDetailBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'People', href: '/people' },
    { name: personName, href: `/people/${personId}` },
    {
      name: 'Feedback Campaigns',
      href: `/people/${personId}/feedback-campaigns`,
    },
    {
      name: campaignTitle,
      href: `/people/${personId}/feedback-campaigns/${campaignId}`,
    },
  ])

  return <>{children}</>
}
