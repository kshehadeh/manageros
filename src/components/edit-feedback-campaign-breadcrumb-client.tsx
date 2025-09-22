'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface EditFeedbackCampaignBreadcrumbClientProps {
  personName: string
  personId: string
  campaignId: string
  children: React.ReactNode
}

export function EditFeedbackCampaignBreadcrumbClient({
  personName,
  personId,
  campaignId,
  children,
}: EditFeedbackCampaignBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'People', href: '/people' },
    { name: personName, href: `/people/${personId}` },
    {
      name: 'Feedback Campaigns',
      href: `/people/${personId}/feedback-campaigns`,
    },
    {
      name: 'Edit Campaign',
      href: `/people/${personId}/feedback-campaigns/${campaignId}/edit`,
    },
  ])

  return <>{children}</>
}
