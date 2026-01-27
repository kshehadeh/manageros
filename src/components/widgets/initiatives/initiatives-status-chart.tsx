'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  type TooltipContentProps,
} from 'recharts'

interface InitiativesStatusChartProps {
  data: Array<{ name: string; value: number; status: string }>
}

// Custom tooltip for bar chart
const BarChartTooltip = ({
  active,
  payload,
}: TooltipContentProps<number, string>) => {
  if (active && payload && payload.length && payload[0]) {
    const data = payload[0]
    const originalData =
      (data.payload as { name?: string; value?: number }) || {}
    const statusName = originalData.name || 'Unknown'
    const count = originalData.value ?? data.value ?? 0
    return (
      <div className='rounded-md border border-border bg-card text-card-foreground p-2 shadow-md'>
        <p className='text-xs font-medium font-mono'>{statusName}</p>
        <p className='text-xs text-muted-foreground font-mono'>
          {count} {count === 1 ? 'initiative' : 'initiatives'}
        </p>
      </div>
    )
  }
  return null
}

export function InitiativesStatusChart({ data }: InitiativesStatusChartProps) {
  const router = useRouter()
  const [primaryColor, setPrimaryColor] = useState('#3b82f6') // fallback color

  useEffect(() => {
    // Get computed CSS variable value at runtime
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      const computed = getComputedStyle(root)
      const primary = computed.getPropertyValue('--color-primary').trim()
      if (primary) {
        // CSS variable is already in HSL format like "hsl(221.2 83.2% 53.3%)"
        setPrimaryColor(primary)
      }
    }
  }, [])

  const handleBarClick = (
    data: unknown,
    _index: number,
    e: React.MouseEvent
  ) => {
    // Stop event propagation to prevent widget-level click handler from firing
    e.stopPropagation()

    // Recharts passes the data object directly as the first parameter
    const barData = data as { status?: string; name?: string; value?: number }
    if (!barData?.status) return

    // Navigate to initiatives list with status filter
    const searchParams = new URLSearchParams()
    searchParams.set('status', barData.status)
    router.push(`/initiatives/list?${searchParams.toString()}`)
  }

  if (data.length === 0) {
    return (
      <div className='flex items-center justify-center h-[200px] text-sm text-muted-foreground'>
        No data available
      </div>
    )
  }

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
        <Bar
          dataKey='value'
          fill={primaryColor}
          radius={[0, 4, 4, 0]}
          onClick={handleBarClick}
          style={{ cursor: 'pointer' }}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={primaryColor}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
