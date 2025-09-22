import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, Mail, Play, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { ExpandableSection } from '@/components/expandable-section'

interface FeedbackCampaign {
  id: string
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
  // Filter to only show active campaigns
  const activeCampaigns = campaigns.filter(
    campaign => campaign.status === 'active'
  )

  if (activeCampaigns.length === 0) {
    return null
  }

  return (
    <ExpandableSection title='Active Feedback Campaigns' viewAllHref='/people'>
      {activeCampaigns.map(campaign => (
        <div key={campaign.id} className='flex items-center justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <Badge variant='success' className='flex items-center gap-1'>
                <Play className='h-3 w-3' />
                Active
              </Badge>
              <Link
                href={`/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}/responses`}
                className='font-medium hover:text-blue-600'
              >
                {campaign.targetPerson.name}
              </Link>
              {campaign.template && (
                <span className='text-sm text-muted-foreground'>
                  • {campaign.template.name}
                </span>
              )}
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground'>
              <div className='flex items-center gap-1'>
                <Calendar className='h-4 w-4' />
                <span>Ends {format(campaign.endDate, 'MMM d, yyyy')}</span>
              </div>
              <div className='flex items-center gap-1'>
                <Users className='h-4 w-4' />
                <span>{campaign.inviteEmails.length} invited</span>
              </div>
              <div className='flex items-center gap-1'>
                <Mail className='h-4 w-4' />
                <span>
                  {campaign.responses.length} / {campaign.inviteEmails.length}{' '}
                  responses
                </span>
              </div>
            </div>
          </div>
          <Link
            href={`/people/${campaign.targetPersonId}/feedback-campaigns/${campaign.id}/responses`}
            className='flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800'
          >
            View Responses
            <ArrowRight className='h-4 w-4' />
          </Link>
        </div>
      ))}
    </ExpandableSection>
  )
}
