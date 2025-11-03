import { getCurrentUser } from '@/lib/auth-utils'
import { SimpleFeedbackCampaignList } from '@/components/feedback/feedback-campaign-simple-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { MessageSquare } from 'lucide-react'
import {
  getActiveFeedbackCampaignsForUser,
  getFeedbackResponseCountsByCampaign,
} from '@/lib/data/feedback-campaigns'

export async function DashboardFeedbackCampaignsServerSection() {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    return null
  }

  // Fetch active feedback campaigns created by the current user
  const campaignsResult = await getActiveFeedbackCampaignsForUser(
    user.id,
    user.organizationId,
    {
      limit: 100,
      includeTargetPerson: true,
      includeTemplate: true,
      includeResponseCount: true,
    }
  )

  // Type assertion: when includeTemplate and includeTargetPerson are true, they will be included
  const campaigns = campaignsResult as Array<
    (typeof campaignsResult)[0] & {
      template: { id: string; name: string; description: string | null } | null
      targetPerson: { id: string; name: string; email: string | null }
    }
  >

  // Get response counts for each campaign
  const campaignIds = campaigns.map(c => c.id)
  const responseCounts = await getFeedbackResponseCountsByCampaign(campaignIds)

  const responseCountMap = new Map(
    responseCounts.map(r => [r.campaignId, Number(r._count)])
  )

  // Transform campaigns to match expected format
  const formattedCampaigns = campaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    targetPersonId: campaign.targetPersonId,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    inviteEmails: campaign.inviteEmails,
    status: campaign.status,
    template: campaign.template,
    responses: Array.from({
      length: responseCountMap.get(campaign.id) || 0,
    }).map((_, i) => ({
      id: `response-${i}`,
      responderEmail: '',
      submittedAt: new Date(),
    })),
    targetPerson: {
      ...campaign.targetPerson,
      email: campaign.targetPerson.email || '',
    },
  }))

  // Only show the section if there are active campaigns
  if (formattedCampaigns.length === 0) {
    return null
  }

  return (
    <PageSection
      header={<SectionHeader icon={MessageSquare} title='Feedback Campaigns' />}
    >
      <SimpleFeedbackCampaignList
        campaigns={formattedCampaigns}
        emptyStateText='No active feedback campaigns.'
      />
    </PageSection>
  )
}
