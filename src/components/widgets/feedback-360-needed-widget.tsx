import { MessageSquare } from 'lucide-react'
import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets/widget-card'
import type { Widget, WidgetContext, WidgetVisibility } from './types'

interface Feedback360NeededData {
  count: number
}

export const feedback360NeededWidget: Widget = {
  metadata: {
    id: 'reports-without-recent-feedback-360',
    title: '360s Needed',
    icon: MessageSquare,
    minWidth: '200px',
    defaultVisible: true,
    category: 'stats',
    description: 'Direct reports who need a 360 feedback campaign',
  },

  async checkVisibility(context: WidgetContext): Promise<WidgetVisibility> {
    if (!context.hasLinkedPerson) {
      return { visible: false, reason: 'User has no linked person' }
    }

    // Check if user has direct reports
    if (!context.personId) {
      return { visible: false, reason: 'No person ID available' }
    }

    const directReportsCount = await prisma.person.count({
      where: {
        organizationId: context.organizationId,
        managerId: context.personId,
      },
    })

    if (directReportsCount === 0) {
      return { visible: false, reason: 'User has no direct reports' }
    }

    return { visible: true, reason: 'User has direct reports' }
  },

  async fetchData(context: WidgetContext): Promise<Feedback360NeededData> {
    if (!context.personId) {
      return { count: 0 }
    }

    // Get tolerance rule for 360 feedback
    const toleranceRule = await prisma.organizationToleranceRule.findFirst({
      where: {
        organizationId: context.organizationId,
        ruleType: 'feedback_360',
        isEnabled: true,
      },
    })

    let feedback360ThresholdMonths = 6
    if (toleranceRule) {
      const config = toleranceRule.config as {
        warningThresholdMonths?: number
      }
      feedback360ThresholdMonths = config.warningThresholdMonths || 6
    }

    // Get all direct reports
    const directReportIds = await prisma.person.findMany({
      where: {
        organizationId: context.organizationId,
        managerId: context.personId,
        status: 'active',
      },
      select: {
        id: true,
      },
    })

    if (directReportIds.length === 0) {
      return { count: 0 }
    }

    const reportIds = directReportIds.map(r => r.id)
    const cutoffDate = new Date(
      Date.now() - feedback360ThresholdMonths * 30 * 24 * 60 * 60 * 1000
    )

    // Get all feedback campaigns for these reports
    const feedbackCampaigns = await prisma.feedbackCampaign.findMany({
      where: {
        targetPersonId: {
          in: reportIds,
        },
      },
      select: {
        targetPersonId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Create a map of reportId -> most recent campaign createdAt
    const reportLastCampaignMap = new Map<string, Date>()
    for (const campaign of feedbackCampaigns) {
      const existing = reportLastCampaignMap.get(campaign.targetPersonId)
      if (!existing || campaign.createdAt > existing) {
        reportLastCampaignMap.set(campaign.targetPersonId, campaign.createdAt)
      }
    }

    // Count reports that don't have a recent feedback campaign
    let count = 0
    for (const reportId of reportIds) {
      const lastCampaign = reportLastCampaignMap.get(reportId)
      if (!lastCampaign || lastCampaign < cutoffDate) {
        count++
      }
    }

    return { count }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { count } = data as Feedback360NeededData
    const IconComponent = metadata.icon

    return (
      <WidgetCard
        title={metadata.title}
        titleIcon={
          IconComponent ? (
            <IconComponent className='w-3 h-3 text-muted-foreground' />
          ) : undefined
        }
        minWidth={metadata.minWidth}
        className='flex-1 min-w-0'
        helpText={metadata.description}
      >
        <div className='flex items-center justify-center'>
          <span className='text-4xl font-bold font-mono'>{count}</span>
        </div>
      </WidgetCard>
    )
  },
}
