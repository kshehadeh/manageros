import { PieChart as PieChartIcon } from 'lucide-react'
import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets/widget-card'
import { InitiativesRagChart } from './initiatives-rag-chart'
import type { Widget, WidgetContext, WidgetVisibility } from '../types'

interface InitiativesRagChartData {
  data: Array<{ name: string; value: number; rag: string }>
  colors: string[]
}

const CHART_COLORS = {
  Red: 'hsl(0, 84.2%, 60.2%)', // destructive color
  Amber: 'hsl(38, 92%, 50%)', // warning color
  Green: 'hsl(142.1, 76.2%, 36.3%)', // success color
}

const DEFAULT_COLOR = 'hsl(var(--muted))'

export const initiativesRagChartWidget: Widget = {
  metadata: {
    id: 'initiatives-rag-chart',
    title: 'Initiatives by RAG Status',
    icon: PieChartIcon,
    minWidth: '320px',
    defaultVisible: true,
    category: 'charts',
    description: 'Breakdown of initiatives by RAG (Red, Amber, Green) status',
  },

  async checkVisibility(_context: WidgetContext): Promise<WidgetVisibility> {
    return { visible: true, reason: 'Always visible' }
  },

  async fetchData(context: WidgetContext): Promise<InitiativesRagChartData> {
    const initiatives = await prisma.initiative.findMany({
      where: {
        organizationId: context.organizationId,
        status: {
          in: ['planned', 'in_progress'],
        },
      },
      select: {
        rag: true,
      },
    })

    // Count by RAG status
    const ragCounts = new Map<string, number>()
    for (const initiative of initiatives) {
      const count = ragCounts.get(initiative.rag) || 0
      ragCounts.set(initiative.rag, count + 1)
    }

    // Map RAG values to readable names
    const ragLabels: Record<string, string> = {
      green: 'Green',
      amber: 'Amber',
      red: 'Red',
    }

    const data = Array.from(ragCounts.entries())
      .map(([rag, value]) => ({
        name: ragLabels[rag] || rag,
        value,
        rag, // Include the RAG value for navigation
      }))
      .sort((a, b) => {
        // Sort: Red, Amber, Green
        const order = { red: 0, amber: 1, green: 2 }
        return (
          (order[a.name.toLowerCase() as keyof typeof order] ?? 3) -
          (order[b.name.toLowerCase() as keyof typeof order] ?? 3)
        )
      })

    // Assign colors based on RAG status
    const colors = data.map(
      entry =>
        CHART_COLORS[entry.name as keyof typeof CHART_COLORS] || DEFAULT_COLOR
    )

    return { data, colors }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { data: chartData, colors } = data as InitiativesRagChartData

    if (chartData.length === 0) {
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
          <div className='flex items-center justify-center h-[200px] text-xs text-muted-foreground font-mono'>
            No data available
          </div>
        </WidgetCard>
      )
    }

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
        <InitiativesRagChart data={chartData} colors={colors} />
      </WidgetCard>
    )
  },
}
