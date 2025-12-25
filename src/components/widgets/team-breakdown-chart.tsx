'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from 'recharts'

interface TeamBreakdownChartProps {
  data: Array<{ name: string; value: number }>
}

const CHART_COLORS = ['#3b82f6'] // blue

// Custom tooltip for bar chart
const BarChartTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length && payload[0]) {
    const data = payload[0]
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

export function TeamBreakdownChart({ data }: TeamBreakdownChartProps) {
  return (
    <ResponsiveContainer width='100%' height={200}>
      <BarChart
        data={data}
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
        <Bar dataKey='value' fill={CHART_COLORS[0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
