import { AlertCircle } from 'lucide-react'
import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets/widget-card'
import type { Widget, WidgetContext, WidgetVisibility } from '../types'

interface InitiativesInExceptionData {
  count: number
}

export const initiativesInExceptionWidget: Widget = {
  metadata: {
    id: 'initiatives-in-exception',
    title: 'Initiatives in Exception',
    icon: AlertCircle,
    minWidth: '200px',
    defaultVisible: true,
    category: 'stats',
    description:
      'Initiatives that do not meet the check-in deadline tolerance rule',
  },

  async checkVisibility(context: WidgetContext): Promise<WidgetVisibility> {
    // Check if initiative_checkin rule exists
    const checkInRule = await prisma.organizationToleranceRule.findFirst({
      where: {
        organizationId: context.organizationId,
        ruleType: 'initiative_checkin',
        isEnabled: true,
      },
    })

    if (!checkInRule) {
      return {
        visible: false,
        reason: 'No initiative check-in tolerance rule configured',
      }
    }

    return { visible: true, reason: 'Initiative check-in rule exists' }
  },

  async fetchData(context: WidgetContext): Promise<InitiativesInExceptionData> {
    // Get tolerance rule for initiative check-in
    const toleranceRule = await prisma.organizationToleranceRule.findFirst({
      where: {
        organizationId: context.organizationId,
        ruleType: 'initiative_checkin',
        isEnabled: true,
      },
    })

    if (!toleranceRule) {
      return { count: 0 }
    }

    // Get all active exceptions for initiative_checkin rule
    const exceptions = await prisma.exception.findMany({
      where: {
        organizationId: context.organizationId,
        ruleId: toleranceRule.id,
        entityType: 'Initiative',
        status: 'active',
      },
      select: {
        entityId: true,
      },
    })

    return { count: exceptions.length }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { count } = data as InitiativesInExceptionData
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
