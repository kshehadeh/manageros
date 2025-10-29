import { notFound } from 'next/navigation'
import { getFeedbackCampaignResponses } from '@/lib/actions/feedback-campaign'
import { FeedbackResponsesList } from '@/components/feedback/feedback-responses-list'
import { FeedbackCampaignResponsesBreadcrumbClient } from '@/components/feedback/feedback-campaign-responses-breadcrumb-client'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, Mail } from 'lucide-react'
import { format } from 'date-fns'

interface FeedbackCampaignResponsesPageProps {
  params: Promise<{
    id: string
    campaignId: string
  }>
}

export default async function FeedbackCampaignResponsesPage({
  params,
}: FeedbackCampaignResponsesPageProps) {
  const { id: _id, campaignId } = await params

  try {
    const campaign = await getFeedbackCampaignResponses(campaignId)

    // Create a meaningful campaign title from the available data
    const campaignTitle = `${campaign.targetPerson.name} Feedback Campaign`

    return (
      <FeedbackCampaignResponsesBreadcrumbClient
        personName={campaign.targetPerson.name}
        personId={campaign.targetPerson.id}
        campaignTitle={campaignTitle}
        campaignId={campaignId}
      >
        <div className='page-container'>
          <div className='page-header'>
            <div>
              <h1 className='page-title'>Feedback Responses</h1>
              <p className='page-subtitle'>
                Responses for feedback campaign about{' '}
                <span className='font-semibold text-foreground'>
                  {campaign.targetPerson.name}
                </span>
              </p>
            </div>
          </div>

          {/* Campaign Summary */}
          <div className='page-section'>
            <h2 className='page-section-title'>Campaign Summary</h2>
            <div className='card-grid'>
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Calendar className='h-4 w-4' />
                  <span>Campaign Period</span>
                </div>
                <p className='font-medium'>
                  {format(campaign.startDate, 'MMM d, yyyy')} -{' '}
                  {format(campaign.endDate, 'MMM d, yyyy')}
                </p>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Mail className='h-4 w-4' />
                  <span>Invited</span>
                </div>
                <p className='font-medium'>
                  {campaign.inviteEmails.length} people
                </p>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Users className='h-4 w-4' />
                  <span>Responses</span>
                </div>
                <div className='flex items-center gap-2'>
                  <p className='font-medium'>
                    {campaign.responses.length} of{' '}
                    {campaign.inviteEmails.length}
                  </p>
                  <Badge
                    variant={
                      campaign.responses.length === campaign.inviteEmails.length
                        ? 'success'
                        : campaign.responses.length > 0
                          ? 'warning'
                          : 'error'
                    }
                  >
                    {Math.round(
                      (campaign.responses.length /
                        campaign.inviteEmails.length) *
                        100
                    )}
                    %
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Responses */}
          <div className='page-section'>
            <h2 className='page-section-title'>
              Individual Responses ({campaign.responses.length})
            </h2>
            <FeedbackResponsesList
              responses={campaign.responses}
              questions={campaign.template?.questions || []}
            />
          </div>
        </div>
      </FeedbackCampaignResponsesBreadcrumbClient>
    )
  } catch (error) {
    console.error('Error loading feedback campaign responses:', error)
    notFound()
  }
}
