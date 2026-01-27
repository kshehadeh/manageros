'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from 'recharts'

interface JobRoleBreakdownChartProps {
  data: Array<{ name: string; value: number }>
  colors: string[]
}

// Custom tooltip for pie charts
const CustomTooltip = ({
  active,
  payload,
}: TooltipContentProps<number, string>) => {
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

export function JobRoleBreakdownChart({
  data: chartData,
  colors,
}: JobRoleBreakdownChartProps) {
  return (
    <div className='flex flex-col md:flex-row gap-3 items-center'>
      <div className='flex-1 w-full md:w-auto' style={{ minWidth: '200px' }}>
        <ResponsiveContainer width='100%' height={200}>
          <PieChart>
            <Pie
              data={chartData}
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
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                const x = cx + radius * Math.cos((midAngle ?? 0) * RADIAN)
                const y = cy + radius * Math.sin((midAngle ?? 0) * RADIAN)

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
                    {`${((percent ?? 0) * 100).toFixed(0)}%`}
                  </text>
                )
              }}
              outerRadius={70}
              fill='#8884d8'
              dataKey='value'
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={CustomTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className='flex-shrink w-full md:w-auto md:max-w-[200px] min-w-0'>
        <div
          className='text-xs font-mono'
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-family-mono)',
          }}
        >
          {chartData.map((entry, index) => (
            <div
              key={index}
              className='flex items-center gap-2 mb-2 last:mb-0 min-w-0'
            >
              <div
                className='w-3 h-3 rounded-full flex-shrink-0'
                style={{
                  backgroundColor: colors[index % colors.length],
                }}
              />
              <span className='text-xs font-mono truncate min-w-0'>
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
