import Link from 'next/link'
import { FeedbackCampaignStatusBadge } from '@/components/feedback/feedback-campaign-status-badge'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ExpandableSection } from '@/components/expandable-section'

interface FeedbackCampaign {
  id: string
  name?: string | null
  targetPersonId: string
  startDate: Date
  endDate: Date
  inviteEmails: string[]
  status: string
  template?: {
    id: string
    name: string
    description?: string | null
  } | null
  responses: {
    id: string
    responderEmail: string
    submittedAt: Date
  }[]
  targetPerson: {
    id: string
    name: string
    email: string
  }
}

interface ActiveFeedbackCampaignsProps {
  campaigns: FeedbackCampaign[]
}

export function ActiveFeedbackCampaigns({
  campaigns,
}: ActiveFeedbackCampaignsProps) {
  if (campaigns.length === 0) {
    return null
  }

  return (
    <ExpandableSection
      title='Feedback Campaigns'
      viewAllHref='/feedback-campaigns'
    >
      {campaigns.map(campaign => (
        <div
          key={campaign.id}
          className='flex items-start justify-between py-3'
        >
          <div className='flex-1 space-y-1'>
            {/* Campaign Title */}
            <Link
              href={`/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}`}
              className='font-medium hover:text-primary transition-colors block'
            >
              {campaign.name || 'Feedback Campaign'}
            </Link>

            {/* Person Name */}
            <div className='text-sm text-muted-foreground'>
              <span>{campaign.targetPerson.name}</span>
            </div>

            {/* Campaign Details */}
            <div className='flex items-center gap-4 text-xs text-muted-foreground'>
              <span>
                {campaign.responses.length} / {campaign.inviteEmails.length}{' '}
                responses
              </span>
              <div className='flex items-center gap-1'>
                <Calendar className='h-3 w-3' />
                <span>
                  {campaign.status === 'active'
                    ? `Ends ${format(campaign.endDate, 'MMM d, yyyy')}`
                    : `Started ${format(campaign.startDate, 'MMM d, yyyy')}`}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge - Pinned to Right */}
          <div className='ml-4 flex-shrink-0'>
            <FeedbackCampaignStatusBadge status={campaign.status} />
          </div>
        </div>
      ))}
    </ExpandableSection>
  )
}
