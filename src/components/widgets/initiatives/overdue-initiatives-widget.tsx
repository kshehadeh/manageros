import { Clock } from 'lucide-react'
import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets/widget-card'
import type { Widget, WidgetContext, WidgetVisibility } from '../types'

interface OverdueInitiativesData {
  count: number
}

export const overdueInitiativesWidget: Widget = {
  metadata: {
    id: 'overdue-initiatives',
    title: 'Overdue Initiatives',
    icon: Clock,
    minWidth: '180px',
    defaultVisible: true,
    category: 'stats',
    description: 'Open initiatives that have passed their target date',
  },

  async checkVisibility(_context: WidgetContext): Promise<WidgetVisibility> {
    return { visible: true, reason: 'Always visible' }
  },

  async fetchData(context: WidgetContext): Promise<OverdueInitiativesData> {
    const now = new Date()

    const count = await prisma.initiative.count({
      where: {
        organizationId: context.organizationId,
        status: {
          in: ['planned', 'in_progress'],
        },
        targetDate: {
          lt: now,
          not: null,
        },
      },
    })

    return { count }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { count } = data as OverdueInitiativesData
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
