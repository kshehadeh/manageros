import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets/widget-card'
import { JobRoleBreakdownChart } from './job-role-breakdown-chart'
import type { Widget, WidgetContext, WidgetVisibility } from './types'

interface JobRoleBreakdownData {
  data: Array<{ name: string; value: number }>
  colors: string[]
}

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
]

export const jobRoleBreakdownWidget: Widget = {
  metadata: {
    id: 'job-role-chart',
    title: 'Job Role Breakdown',
    minWidth: '320px',
    defaultVisible: true,
    category: 'charts',
    description: 'Distribution of people across job roles',
  },

  async checkVisibility(context: WidgetContext): Promise<WidgetVisibility> {
    // Check if there are any job roles with people
    const jobRoleBreakdown = await prisma.person.groupBy({
      by: ['jobRoleId'],
      where: {
        organizationId: context.organizationId,
      },
      _count: {
        id: true,
      },
    })

    const hasJobRoles = jobRoleBreakdown.some(item => item.jobRoleId !== null)

    if (!hasJobRoles) {
      return { visible: false, reason: 'No job roles with people found' }
    }

    return { visible: true, reason: 'Job roles with people found' }
  },

  async fetchData(context: WidgetContext): Promise<JobRoleBreakdownData> {
    // Get job role breakdown
    const jobRoleBreakdown = await prisma.person.groupBy({
      by: ['jobRoleId'],
      where: {
        organizationId: context.organizationId,
      },
      _count: {
        id: true,
      },
    })

    // Get job role titles
    const jobRoleIds = jobRoleBreakdown
      .map(item => item.jobRoleId)
      .filter((id): id is string => id !== null)

    const jobRoles =
      jobRoleIds.length > 0
        ? await prisma.jobRole.findMany({
            where: {
              id: { in: jobRoleIds },
              organizationId: context.organizationId,
            },
            select: {
              id: true,
              title: true,
            },
          })
        : []

    const jobRoleMap = new Map(jobRoles.map(role => [role.id, role.title]))

    // Prepare chart data
    const data = jobRoleBreakdown
      .filter(item => item.jobRoleId !== null)
      .map(item => ({
        name: jobRoleMap.get(item.jobRoleId!) || 'Unknown',
        value: item._count.id,
      }))

    // Assign colors
    const colors = data.map(
      (_, index) => CHART_COLORS[index % CHART_COLORS.length]
    )

    return { data, colors }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { data: chartData, colors } = data as JobRoleBreakdownData

    if (chartData.length === 0) {
      return (
        <WidgetCard
          title={metadata.title}
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
        minWidth={metadata.minWidth}
        className='flex-1 min-w-0'
        helpText={metadata.description}
      >
        <JobRoleBreakdownChart data={chartData} colors={colors} />
      </WidgetCard>
    )
  },
}
