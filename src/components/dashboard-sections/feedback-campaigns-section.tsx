'use client'

import { useMemo } from 'react'
import { ActiveFeedbackCampaigns } from '@/components/feedback/active-feedback-campaigns'
import { useFeedbackCampaigns } from '@/hooks/use-feedback-campaigns'
import { useSession } from 'next-auth/react'
import { Skeleton } from '@/components/ui/skeleton'

function FeedbackCampaignsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className='flex items-start justify-between py-3'>
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-3 w-32' />
            <div className='flex items-center gap-4'>
              <Skeleton className='h-3 w-20' />
              <Skeleton className='h-3 w-24' />
            </div>
          </div>
          <div className='ml-4 shrink-0'>
            <Skeleton className='h-6 w-16' />
          </div>
        </div>
      ))}
    </>
  )
}

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

  if (error) {
    console.error('Error loading feedback campaigns:', error)
    return null
  }

  const campaigns = data?.campaigns || []

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

  return (
    <ActiveFeedbackCampaigns
      campaigns={formattedCampaigns}
      skeleton={
        loading || status === 'loading' ? <FeedbackCampaignsSkeleton /> : null
      }
    />
  )
}
