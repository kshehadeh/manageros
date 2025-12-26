import { prisma } from '@/lib/db'
import { WidgetCard } from '@/components/widgets/widget-card'
import { TeamBreakdownChart } from './team-breakdown-chart'
import type { Widget, WidgetContext, WidgetVisibility } from './types'

interface TeamBreakdownData {
  data: Array<{ name: string; value: number }>
}

export const teamBreakdownWidget: Widget = {
  metadata: {
    id: 'team-chart',
    title: 'Team Breakdown',
    minWidth: '400px',
    defaultVisible: true,
    category: 'charts',
    description: 'Distribution of people across teams',
  },

  async checkVisibility(context: WidgetContext): Promise<WidgetVisibility> {
    // Check if there are any teams with people
    const teamBreakdown = await prisma.person.groupBy({
      by: ['teamId'],
      where: {
        organizationId: context.organizationId,
      },
      _count: {
        id: true,
      },
    })

    const hasTeams = teamBreakdown.some(item => item.teamId !== null)

    if (!hasTeams) {
      return { visible: false, reason: 'No teams with people found' }
    }

    return { visible: true, reason: 'Teams with people found' }
  },

  async fetchData(context: WidgetContext): Promise<TeamBreakdownData> {
    // Get team breakdown
    const teamBreakdown = await prisma.person.groupBy({
      by: ['teamId'],
      where: {
        organizationId: context.organizationId,
      },
      _count: {
        id: true,
      },
    })

    // Get team names
    const teamIds = teamBreakdown
      .map(item => item.teamId)
      .filter((id): id is string => id !== null)

    const teams =
      teamIds.length > 0
        ? await prisma.team.findMany({
            where: {
              id: { in: teamIds },
              organizationId: context.organizationId,
            },
            select: {
              id: true,
              name: true,
            },
          })
        : []

    const teamMap = new Map(teams.map(team => [team.id, team.name]))

    // Prepare chart data
    const data = teamBreakdown
      .filter(item => item.teamId !== null)
      .map(item => ({
        name: teamMap.get(item.teamId!) || 'Unknown',
        value: item._count.id,
      }))

    return { data }
  },

  render(data: unknown, metadata, _context: WidgetContext) {
    const { data: chartData } = data as TeamBreakdownData

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
        <TeamBreakdownChart data={chartData} />
      </WidgetCard>
    )
  },
}
