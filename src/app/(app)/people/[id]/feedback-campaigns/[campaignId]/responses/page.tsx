import { notFound } from 'next/navigation'
import { getFeedbackCampaignResponses } from '@/lib/actions/feedback-campaign'
import { FeedbackResponsesList } from '@/components/feedback/feedback-responses-list'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'
import { Badge } from '@/components/ui/badge'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
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

  const campaign = await getFeedbackCampaignResponses(campaignId)
  if (!campaign) {
    notFound()
  }

  // Create a meaningful campaign title from the available data
  const campaignTitle = `${campaign.targetPerson.name} Feedback 360`

  const pathname = `/people/${campaign.targetPerson.id}/feedback-campaigns/${campaignId}/responses`
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'People', href: '/people' },
    {
      name: campaign.targetPerson.name,
      href: `/people/${campaign.targetPerson.id}`,
    },
    {
      name: 'Feedback 360',
      href: `/people/${campaign.targetPerson.id}/feedback-campaigns`,
    },
    {
      name: campaignTitle,
      href: `/people/${campaign.targetPerson.id}/feedback-campaigns/${campaignId}`,
    },
    { name: 'Responses', href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title='Feedback Responses'
          subtitle={
            <>
              Responses for Feedback 360 about{' '}
              <span className='font-semibold text-foreground'>
                {campaign.targetPerson.name}
              </span>
            </>
          }
        />

        <PageContent>
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
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
