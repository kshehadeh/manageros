import { User } from 'lucide-react'
import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets/widget-card'
import type { Widget, WidgetContext, WidgetVisibility } from '../types'

interface UserInitiativesData {
  count: number
}

export const userInitiativesWidget: Widget = {
  metadata: {
    id: 'user-initiatives',
    title: 'My Initiatives',
    icon: User,
    minWidth: '160px',
    defaultVisible: true,
    category: 'stats',
    description: 'Number of initiatives you are associated with as an owner',
  },

  async checkVisibility(context: WidgetContext): Promise<WidgetVisibility> {
    if (!context.personId) {
      return {
        visible: false,
        reason: 'User does not have a linked person record',
      }
    }

    return { visible: true, reason: 'User has linked person' }
  },

  async fetchData(context: WidgetContext): Promise<UserInitiativesData> {
    if (!context.personId) {
      return { count: 0 }
    }

    const count = await prisma.initiative.count({
      where: {
        organizationId: context.organizationId,
        owners: {
          some: {
            personId: context.personId,
          },
        },
      },
    })

    return { count }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { count } = data as UserInitiativesData
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
