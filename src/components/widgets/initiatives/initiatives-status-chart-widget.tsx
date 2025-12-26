/* eslint-disable camelcase */
import { BarChart3 } from 'lucide-react'
import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets/widget-card'
import { InitiativesStatusChart } from './initiatives-status-chart'
import type { Widget, WidgetContext, WidgetVisibility } from '../types'

interface InitiativesStatusChartData {
  data: Array<{ name: string; value: number }>
}

export const initiativesStatusChartWidget: Widget = {
  metadata: {
    id: 'initiatives-status-chart',
    title: 'Initiatives by Status',
    icon: BarChart3,
    minWidth: '320px',
    defaultVisible: true,
    category: 'charts',
    description: 'Breakdown of initiatives by status',
  },

  async checkVisibility(_context: WidgetContext): Promise<WidgetVisibility> {
    return { visible: true, reason: 'Always visible' }
  },

  async fetchData(context: WidgetContext): Promise<InitiativesStatusChartData> {
    const initiatives = await prisma.initiative.findMany({
      where: {
        organizationId: context.organizationId,
      },
      select: {
        status: true,
      },
    })

    // Count by status
    const statusCounts = new Map<string, number>()
    for (const initiative of initiatives) {
      const count = statusCounts.get(initiative.status) || 0
      statusCounts.set(initiative.status, count + 1)
    }

    // Map status values to readable names
    const statusLabels: Record<string, string> = {
      planned: 'Planned',
      in_progress: 'In Progress',
      paused: 'Paused',
      done: 'Done',
      canceled: 'Canceled',
    }

    const data = Array.from(statusCounts.entries())
      .map(([status, value]) => ({
        name: statusLabels[status] || status,
        value,
      }))
      .sort((a, b) => b.value - a.value)

    return { data }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { data: chartData } = data as InitiativesStatusChartData

    return (
      <WidgetCard
        title={metadata.title}
        titleIcon={
          metadata.icon ? (
            <metadata.icon className='w-3 h-3 text-muted-foreground' />
          ) : undefined
        }
        minWidth={metadata.minWidth}
        className='flex-1 min-w-0'
        helpText={metadata.description}
      >
        <InitiativesStatusChart data={chartData} />
      </WidgetCard>
    )
  },
}
