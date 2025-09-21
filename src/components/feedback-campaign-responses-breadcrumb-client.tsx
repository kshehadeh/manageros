'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface FeedbackCampaignResponsesBreadcrumbClientProps {
  personName: string
  personId: string
  campaignTitle: string
  campaignId: string
  children: React.ReactNode
}

export function FeedbackCampaignResponsesBreadcrumbClient({
  personName,
  personId,
  campaignTitle,
  campaignId,
  children,
}: FeedbackCampaignResponsesBreadcrumbClientProps) {
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
    {
      name: 'Responses',
      href: `/people/${personId}/feedback-campaigns/${campaignId}/responses`,
    },
  ])

  return <>{children}</>
}
