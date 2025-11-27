import { SimpleFeedbackCampaignList } from '@/components/feedback/feedback-campaign-simple-list'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Button } from '@/components/ui/button'
import { MessageCircle, Eye, Plus } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { getActiveAndDraftFeedbackCampaignsForPerson } from '@/lib/data/feedback-campaigns'

interface FeedbackCampaignsSectionProps {
  personId: string
  organizationId: string
  currentUserId: string
}

export async function FeedbackCampaignsSection({
  personId,
  organizationId,
  currentUserId,
}: FeedbackCampaignsSectionProps) {
  if (!organizationId) {
    return null
  }

  // Get feedback campaigns for this person
  const feedbackCampaigns = await getActiveAndDraftFeedbackCampaignsForPerson(
    personId,
    organizationId,
    currentUserId
  )

  // Only show if there are active or draft campaigns
  if (feedbackCampaigns.length === 0) {
    return null
  }

  return (
    <div className='flex-1 min-w-[300px]'>
      <PageSection
        header={
          <SectionHeader
            icon={MessageCircle}
            title={`Feedback 360`}
            action={
              <div className='flex items-center gap-2'>
                <Button
                  asChild
                  variant='outline'
                  size='sm'
                  title='View All Feedback 360'
                >
                  <Link href={`/people/${personId}/feedback-campaigns`}>
                    <Eye className='w-4 h-4' />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  size='sm'
                  title='Create New Feedback 360'
                >
                  <Link href={`/people/${personId}/feedback-campaigns/new`}>
                    <Plus className='w-4 h-4' />
                  </Link>
                </Button>
              </div>
            }
          />
        }
      >
        <SimpleFeedbackCampaignList
          campaigns={feedbackCampaigns}
          hidePersonName
          emptyStateText='No active or draft Feedback 360.'
        />
      </PageSection>
    </div>
  )
}
