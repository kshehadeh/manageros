import { Users } from 'lucide-react'
import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets/widget-card'
import type { Widget, WidgetContext, WidgetVisibility } from './types'

interface TotalPeopleData {
  count: number
}

export const totalPeopleWidget: Widget = {
  metadata: {
    id: 'total-people',
    title: 'Total People',
    icon: Users,
    minWidth: '160px',
    defaultVisible: true,
    category: 'stats',
    description: 'Total number of people in your organization',
  },

  async checkVisibility(_context: WidgetContext): Promise<WidgetVisibility> {
    return { visible: true, reason: 'Always visible' }
  },

  async fetchData(context: WidgetContext): Promise<TotalPeopleData> {
    const count = await prisma.person.count({
      where: {
        organizationId: context.organizationId,
      },
    })

    return { count }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { count } = data as TotalPeopleData
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
