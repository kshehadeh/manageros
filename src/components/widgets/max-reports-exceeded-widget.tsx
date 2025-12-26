import { AlertTriangle } from 'lucide-react'
import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets/widget-card'
import type { Widget, WidgetContext, WidgetVisibility } from './types'

interface MaxReportsExceededData {
  count: number
}

export const maxReportsExceededWidget: Widget = {
  metadata: {
    id: 'managers-exceeding-max-reports',
    title: 'Max Reports Exceeded',
    icon: AlertTriangle,
    minWidth: '200px',
    defaultVisible: true,
    category: 'stats',
    description: 'Managers who are exceeding the maximum reports threshold',
  },

  async checkVisibility(context: WidgetContext): Promise<WidgetVisibility> {
    // Check if max_reports rule exists
    const maxReportsRule = await prisma.organizationToleranceRule.findFirst({
      where: {
        organizationId: context.organizationId,
        ruleType: 'max_reports',
        isEnabled: true,
      },
    })

    if (!maxReportsRule) {
      return { visible: false, reason: 'No max reports rule configured' }
    }

    return { visible: true, reason: 'Max reports rule exists' }
  },

  async fetchData(context: WidgetContext): Promise<MaxReportsExceededData> {
    // Get tolerance rule for max reports
    const toleranceRule = await prisma.organizationToleranceRule.findFirst({
      where: {
        organizationId: context.organizationId,
        ruleType: 'max_reports',
        isEnabled: true,
      },
    })

    if (!toleranceRule) {
      return { count: 0 }
    }

    // Get all active exceptions for max_reports rule
    const exceptions = await prisma.exception.findMany({
      where: {
        organizationId: context.organizationId,
        ruleId: toleranceRule.id,
        entityType: 'Person',
        status: 'active',
      },
      select: {
        entityId: true,
      },
    })

    return { count: exceptions.length }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { count } = data as MaxReportsExceededData
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
