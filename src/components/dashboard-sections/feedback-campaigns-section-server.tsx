import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { SimpleFeedbackCampaignList } from '@/components/feedback/feedback-campaign-simple-list'

export async function DashboardFeedbackCampaignsServerSection() {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    return null
  }

  // Fetch active feedback campaigns created by the current user
  const campaigns = await prisma.feedbackCampaign.findMany({
    where: {
      userId: user.id,
      status: 'active',
      targetPerson: {
        organizationId: user.organizationId,
      },
    },
    include: {
      targetPerson: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      template: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      _count: {
        select: {
          responses: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // Get response counts for each campaign
  const campaignIds = campaigns.map(c => c.id)
  const responseCounts =
    campaignIds.length > 0
      ? await prisma.feedbackResponse.groupBy({
          by: ['campaignId'],
          where: {
            campaignId: { in: campaignIds },
          },
          _count: true,
        })
      : []

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
    <SimpleFeedbackCampaignList
      campaigns={formattedCampaigns}
      title='Feedback Campaigns'
      viewAllHref='/feedback-campaigns'
      emptyStateText='No active feedback campaigns.'
    />
  )
}
