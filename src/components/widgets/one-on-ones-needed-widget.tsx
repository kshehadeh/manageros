import { Handshake } from 'lucide-react'
import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets/widget-card'
import type { Widget, WidgetContext, WidgetVisibility } from './types'

interface OneOnOnesNeededData {
  count: number
}

export const oneOnOnesNeededWidget: Widget = {
  metadata: {
    id: 'reports-without-recent-one-on-one',
    title: '1:1s Needed',
    icon: Handshake,
    minWidth: '200px',
    defaultVisible: true,
    category: 'stats',
    description: 'Direct reports who need a 1-on-1 meeting',
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

  async fetchData(context: WidgetContext): Promise<OneOnOnesNeededData> {
    if (!context.personId) {
      return { count: 0 }
    }

    // Get tolerance rule for 1-on-1 frequency
    const toleranceRule = await prisma.organizationToleranceRule.findFirst({
      where: {
        organizationId: context.organizationId,
        ruleType: 'one_on_one_frequency',
        isEnabled: true,
      },
    })

    let toleranceThresholdDays = 14
    if (toleranceRule) {
      const config = toleranceRule.config as {
        warningThresholdDays?: number
        urgentThresholdDays?: number
      }
      toleranceThresholdDays =
        config.warningThresholdDays || config.urgentThresholdDays || 14
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
      Date.now() - toleranceThresholdDays * 24 * 60 * 60 * 1000
    )

    // Get all 1-on-1s for these manager-report pairs
    const oneOnOnes = await prisma.oneOnOne.findMany({
      where: {
        OR: [
          {
            managerId: context.personId,
            reportId: { in: reportIds },
          },
          {
            managerId: { in: reportIds },
            reportId: context.personId,
          },
        ],
        scheduledAt: {
          not: null,
        },
      },
      select: {
        managerId: true,
        reportId: true,
        scheduledAt: true,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    })

    // Create a map of reportId -> most recent scheduledAt
    const reportLastOneOnOneMap = new Map<string, Date>()
    for (const oneOnOne of oneOnOnes) {
      if (!oneOnOne.scheduledAt) continue

      const reportId =
        oneOnOne.managerId === context.personId
          ? oneOnOne.reportId
          : oneOnOne.managerId

      const existing = reportLastOneOnOneMap.get(reportId)
      if (!existing || oneOnOne.scheduledAt > existing) {
        reportLastOneOnOneMap.set(reportId, oneOnOne.scheduledAt)
      }
    }

    // Count reports that don't have a recent 1-on-1
    let count = 0
    for (const reportId of reportIds) {
      const lastOneOnOne = reportLastOneOnOneMap.get(reportId)
      if (!lastOneOnOne || lastOneOnOne < cutoffDate) {
        count++
      }
    }

    return { count }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { count } = data as OneOnOnesNeededData
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
