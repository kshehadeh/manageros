import Link from 'next/link'
import { FeedbackCampaignStatusBadge } from '@/components/feedback-campaign-status-badge'
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
    <ExpandableSection title='Feedback Campaigns' viewAllHref='/people'>
      {campaigns.map(campaign => (
        <div
          key={campaign.id}
          className='flex items-center justify-between py-3'
        >
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <FeedbackCampaignStatusBadge status={campaign.status} />
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <span>{campaign.targetPerson.name}</span>
              </div>
              <Link
                href={`/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}/responses`}
                className='font-medium hover:text-blue-600'
              >
                {campaign.name || campaign.targetPerson.name}
              </Link>
            </div>
            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
              <span>
                {campaign.responses.length} / {campaign.inviteEmails.length}{' '}
                responses
              </span>
              <div className='flex items-center gap-1'>
                <Calendar className='h-4 w-4' />
                <span>
                  {campaign.status === 'active'
                    ? `Ends ${format(campaign.endDate, 'MMM d, yyyy')}`
                    : `Started ${format(campaign.startDate, 'MMM d, yyyy')}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </ExpandableSection>
  )
}
