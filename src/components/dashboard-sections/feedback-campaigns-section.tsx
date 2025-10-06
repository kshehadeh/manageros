import { ActiveFeedbackCampaigns } from '@/components/feedback/active-feedback-campaigns'
import { getActiveFeedbackCampaignsForUser } from '@/lib/actions/feedback-campaign'

export async function DashboardFeedbackCampaignsSection() {
  const campaigns = await getActiveFeedbackCampaignsForUser()

  if (!campaigns || campaigns.length === 0) return null

  return (
    <ActiveFeedbackCampaigns
      campaigns={campaigns.map(campaign => ({
        ...campaign,
        status: campaign.status as
          | 'draft'
          | 'active'
          | 'completed'
          | 'cancelled',
        template: campaign.template
          ? {
              id: campaign.template.id,
              name: campaign.template.name,
              description: campaign.template.description || undefined,
            }
          : null,
        targetPerson: {
          ...campaign.targetPerson,
          email: campaign.targetPerson.email || '',
        },
      }))}
    />
  )
}
