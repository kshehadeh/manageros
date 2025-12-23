/* eslint-disable camelcase */
'use client'

import { WidgetCard } from '@/components/people/widget-card'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from 'recharts'
import type { PeopleStats } from '@/lib/actions/people-stats'

/**
 * Widget IDs for future customization support
 */
export const CHART_IDS = {
  STATUS_CHART: 'status-chart',
  TEAM_CHART: 'team-chart',
  JOB_ROLE_CHART: 'job-role-chart',
} as const

export type ChartId = (typeof CHART_IDS)[keyof typeof CHART_IDS]

type ChartType = 'pie' | 'bar'

interface ChartConfig {
  id: ChartId
  title: string
  data: Array<{ name: string; value: number }>
  colors: string[]
  show: boolean
  minWidth?: string
  chartType?: ChartType
}

// Color palette for charts
// Using theme-aware colors that work in both light and dark modes
// These colors are chosen to have good contrast in both themes
const CHART_COLORS = [
  '#3b82f6', // blue (primary-like)
  '#10b981', // green (success)
  '#6366f1', // indigo (info-like)
  '#f59e0b', // amber (warning)
  '#ef4444', // red (error)
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
]

// Status-specific colors matching badge colors
const STATUS_COLORS: Record<string, string> = {
  active: '#10b981', // green (success)
  inactive: '#ef4444', // red (error)
  on_leave: '#f59e0b', // amber (warning)
  terminated: '#ef4444', // red (error)
}

// Format status labels
function formatStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    on_leave: 'On Leave',
    terminated: 'Terminated',
  }
  return statusMap[status] || status
}

interface PeopleBreakdownChartsProps {
  stats: PeopleStats
}

export function PeopleBreakdownCharts({ stats }: PeopleBreakdownChartsProps) {
  // Prepare chart data
  const statusData = stats.statusBreakdown.map(item => ({
    name: formatStatusLabel(item.status),
    value: item.count,
    status: item.status,
  }))

  const teamData = stats.teamBreakdown
    .filter(item => item.teamName !== null)
    .map(item => ({
      name: item.teamName || 'Unknown',
      value: item.count,
    }))

  const jobRoleData = stats.jobRoleBreakdown
    .filter(item => item.jobRoleTitle !== null)
    .map(item => ({
      name: item.jobRoleTitle || 'Unknown',
      value: item.count,
    }))

  // Structure charts as config array for future customization support
  const chartConfigs: ChartConfig[] = [
    {
      id: CHART_IDS.STATUS_CHART,
      title: 'Status Breakdown',
      data: statusData,
      colors: statusData.map(
        item => STATUS_COLORS[item.status] || CHART_COLORS[0]
      ),
      show: statusData.length > 0,
      minWidth: '280px',
    },
    {
      id: CHART_IDS.TEAM_CHART,
      title: 'Team Breakdown',
      data: teamData,
      colors: CHART_COLORS,
      show: teamData.length > 0,
      minWidth: '400px', // Wider for bar chart with team names
      chartType: 'bar',
    },
    {
      id: CHART_IDS.JOB_ROLE_CHART,
      title: 'Job Role Breakdown',
      data: jobRoleData,
      colors: CHART_COLORS,
      show: jobRoleData.length > 0,
      minWidth: '320px', // Wider for longer job role names
    },
  ]

  // Filter charts based on visibility (future: can be filtered by user preferences)
  const visibleCharts = chartConfigs.filter(chart => chart.show)

  if (visibleCharts.length === 0) {
    return null
  }

  // Custom tooltip for pie charts
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length && payload[0]) {
      const data = payload[0]
      return (
        <div className='rounded-md border border-border bg-card text-card-foreground p-2 shadow-md'>
          <p className='text-xs font-medium'>{data.name || 'Unknown'}</p>
          <p className='text-xs text-muted-foreground font-mono'>
            Count: {data.value}
          </p>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for bar chart (team breakdown)
  const BarChartTooltip = ({
    active,
    payload,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length && payload[0]) {
      const data = payload[0]
      // For bar charts, the original data object is in payload.payload
      // data.name is the dataKey name ("value"), not the team name
      const originalData =
        (data.payload as { name?: string; value?: number }) || {}
      const teamName = originalData.name || 'Unknown'
      const peopleCount = originalData.value || data.value || 0
      return (
        <div className='rounded-md border border-border bg-card text-card-foreground p-2 shadow-md'>
          <p className='text-xs font-medium font-mono'>{teamName}</p>
          <p className='text-xs text-muted-foreground font-mono'>
            {peopleCount} {peopleCount === 1 ? 'person' : 'people'}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className='flex flex-wrap gap-4'>
      {visibleCharts.map(chart => (
        <WidgetCard
          key={chart.id}
          title={chart.title}
          minWidth={chart.minWidth}
          className='flex-1 min-w-0'
        >
          {chart.data.length > 0 ? (
            chart.chartType === 'bar' ? (
              <ResponsiveContainer width='100%' height={200}>
                <BarChart
                  data={chart.data}
                  layout='vertical'
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <XAxis
                    type='number'
                    tick={{
                      fontSize: 11,
                      fontFamily: 'var(--font-family-mono)',
                    }}
                  />
                  <YAxis
                    type='category'
                    dataKey='name'
                    width={100}
                    tick={{
                      fontSize: 11,
                      fontFamily: 'var(--font-family-mono)',
                    }}
                  />
                  <Tooltip content={BarChartTooltip} />
                  <Bar dataKey='value' fill={chart.colors[0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex flex-col md:flex-row gap-3 items-center md:items-start'>
                <div
                  className='flex-1 w-full md:w-auto'
                  style={{ minWidth: '200px' }}
                >
                  <ResponsiveContainer width='100%' height={200}>
                    <PieChart>
                      <Pie
                        data={chart.data}
                        cx='50%'
                        cy='50%'
                        labelLine={false}
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          percent,
                        }) => {
                          const RADIAN = Math.PI / 180
                          const radius =
                            innerRadius + (outerRadius - innerRadius) * 0.5
                          const x = cx + radius * Math.cos(-midAngle * RADIAN)
                          const y = cy + radius * Math.sin(-midAngle * RADIAN)

                          return (
                            <text
                              x={x}
                              y={y}
                              fill='currentColor'
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline='central'
                              style={{
                                fontSize: '11px',
                                fontFamily: 'var(--font-family-mono)',
                              }}
                              className='text-xs font-mono'
                            >
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          )
                        }}
                        outerRadius={70}
                        fill='#8884d8'
                        dataKey='value'
                      >
                        {chart.data.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={chart.colors[index % chart.colors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={CustomTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className='flex-shrink-0 w-full md:w-auto'>
                  <div
                    className='text-xs font-mono'
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-family-mono)',
                    }}
                  >
                    {chart.data.map((entry, index) => (
                      <div
                        key={index}
                        className='flex items-center gap-2 mb-2 last:mb-0'
                      >
                        <div
                          className='w-3 h-3 rounded-full flex-shrink-0'
                          style={{
                            backgroundColor:
                              chart.colors[index % chart.colors.length],
                          }}
                        />
                        <span className='text-xs font-mono'>{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className='flex items-center justify-center h-[200px] text-xs text-muted-foreground font-mono'>
              No data available
            </div>
          )}
        </WidgetCard>
      ))}
    </div>
  )
}
