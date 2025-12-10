import { SimpleFeedbackCampaignList } from '@/components/feedback/feedback-campaign-simple-list'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { MessageCircle } from 'lucide-react'
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
    <PageSection
      className='flex-1 min-w-[300px]'
      header={<SectionHeader icon={MessageCircle} title={`Feedback 360`} />}
    >
      <SimpleFeedbackCampaignList
        campaigns={feedbackCampaigns}
        hidePersonName
        emptyStateText='No active or draft Feedback 360.'
      />
    </PageSection>
  )
}
