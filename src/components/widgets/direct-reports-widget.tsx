import { UserCheck } from 'lucide-react'
import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets/widget-card'
import type { Widget, WidgetContext, WidgetVisibility } from './types'

interface DirectReportsData {
  count: number
}

export const directReportsWidget: Widget = {
  metadata: {
    id: 'direct-reports',
    title: 'Direct Reports',
    icon: UserCheck,
    minWidth: '160px',
    defaultVisible: true,
    category: 'stats',
    description: 'Number of people who report directly to you',
  },

  async checkVisibility(context: WidgetContext): Promise<WidgetVisibility> {
    if (!context.hasLinkedPerson) {
      return { visible: false, reason: 'User has no linked person' }
    }
    return { visible: true, reason: 'User has linked person' }
  },

  async fetchData(context: WidgetContext): Promise<DirectReportsData> {
    if (!context.personId) {
      return { count: 0 }
    }

    const count = await prisma.person.count({
      where: {
        organizationId: context.organizationId,
        managerId: context.personId,
      },
    })

    return { count }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { count } = data as DirectReportsData
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
