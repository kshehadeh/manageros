'use client'

import { useMemo } from 'react'
import { ActiveFeedbackCampaigns } from '@/components/feedback/active-feedback-campaigns'
import { useFeedbackCampaigns } from '@/hooks/use-feedback-campaigns'
import { useSession } from 'next-auth/react'

export function DashboardFeedbackCampaignsSection() {
  const { status } = useSession()

  // Memoize immutableFilters to prevent infinite loop
  const immutableFilters = useMemo(
    () => ({
      status: 'active',
    }),
    []
  )

  const { data, loading, error } = useFeedbackCampaigns({
    immutableFilters,
    limit: 100,
    enabled: status !== 'loading',
  })

  if (loading || status === 'loading') {
    return (
      <div className='card'>
        <div className='flex items-center justify-center py-8'>
          <div className='text-muted-foreground'>Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    console.error('Error loading feedback campaigns:', error)
    return null
  }

  const campaigns = data?.campaigns || []

  if (!campaigns || campaigns.length === 0) return null

  // Transform campaigns to match expected format
  const formattedCampaigns = campaigns.map(campaign => ({
    ...campaign,
    name: null,
    // Parse ISO strings back to Date objects for date-fns formatting
    startDate: new Date(campaign.startDate),
    endDate: new Date(campaign.endDate),
    inviteEmails: [],
    responses: Array.from({ length: campaign._count.completedResponses }).map(
      (_, i) => ({
        id: `response-${i}`,
        responderEmail: '',
        submittedAt: new Date(),
      })
    ),
  }))

  return <ActiveFeedbackCampaigns campaigns={formattedCampaigns} />
}
