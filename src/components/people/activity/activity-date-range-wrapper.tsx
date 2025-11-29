'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import {
  DateRangeDropdown,
  type DateRange,
  type DateRangePreset,
} from './date-range-dropdown'

interface ActivityDateRangeWrapperProps {
  children: React.ReactNode
}

function getDefaultDateRange(): DateRange {
  const today = endOfDay(new Date())
  const from = startOfDay(subDays(today, 30))
  return {
    from,
    to: today,
    preset: 'last-month',
  }
}

function parseDateRangeFromUrl(searchParams: URLSearchParams): DateRange {
  const preset = searchParams.get('preset') as DateRangePreset | null
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  if (preset && preset !== 'custom') {
    const today = endOfDay(new Date())
    let from: Date

    switch (preset) {
      case 'yesterday':
        from = startOfDay(subDays(today, 1))
        break
      case 'last-week':
        from = startOfDay(subDays(today, 7))
        break
      case 'last-2-weeks':
        from = startOfDay(subDays(today, 14))
        break
      case 'last-month':
        from = startOfDay(subDays(today, 30))
        break
      default:
        from = startOfDay(subDays(today, 30))
    }

    return { from, to: today, preset }
  }

  if (fromParam && toParam) {
    return {
      from: new Date(fromParam),
      to: new Date(toParam),
      preset: 'custom',
    }
  }

  return getDefaultDateRange()
}

export function ActivityDateRangeWrapper({
  children,
}: ActivityDateRangeWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    parseDateRangeFromUrl(searchParams)
  )

  useEffect(() => {
    const newRange = parseDateRangeFromUrl(searchParams)
    setDateRange(newRange)
  }, [searchParams])

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
    const params = new URLSearchParams(searchParams.toString())
    params.set('preset', range.preset || 'last-month')
    if (range.preset === 'custom') {
      params.set('from', range.from.toISOString())
      params.set('to', range.to.toISOString())
    } else {
      params.delete('from')
      params.delete('to')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className='flex items-center gap-2'>
      <DateRangeDropdown value={dateRange} onChange={handleDateRangeChange} />
      {children}
    </div>
  )
}
