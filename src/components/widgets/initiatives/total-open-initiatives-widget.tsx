import { Rocket } from 'lucide-react'
import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets/widget-card'
import type { Widget, WidgetContext, WidgetVisibility } from '../types'

interface TotalOpenInitiativesData {
  count: number
}

export const totalOpenInitiativesWidget: Widget = {
  metadata: {
    id: 'total-open-initiatives',
    title: 'Open Initiatives',
    icon: Rocket,
    minWidth: '160px',
    defaultVisible: true,
    category: 'stats',
    description: 'Total number of open initiatives (planned or in progress)',
  },

  async checkVisibility(_context: WidgetContext): Promise<WidgetVisibility> {
    return { visible: true, reason: 'Always visible' }
  },

  async fetchData(context: WidgetContext): Promise<TotalOpenInitiativesData> {
    const count = await prisma.initiative.count({
      where: {
        organizationId: context.organizationId,
        status: {
          in: ['planned', 'in_progress'],
        },
      },
    })

    return { count }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { count } = data as TotalOpenInitiativesData
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
