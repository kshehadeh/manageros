'use client'

import { useState, useEffect } from 'react'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

export type DateRangePreset =
  | 'yesterday'
  | 'last-week'
  | 'last-2-weeks'
  | 'last-month'
  | 'custom'

export interface DateRange {
  from: Date
  to: Date
  preset?: DateRangePreset
}

interface DateRangeDropdownProps {
  value?: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

export function DateRangeDropdown({
  value,
  onChange,
  className,
}: DateRangeDropdownProps) {
  const [customDate, setCustomDate] = useState<Date | undefined>(
    value?.preset === 'custom' ? value.from : undefined
  )
  const [isCustomOpen, setIsCustomOpen] = useState(false)

  // Sync customDate with value prop
  useEffect(() => {
    if (value?.preset === 'custom') {
      setCustomDate(value.from)
    }
  }, [value])

  const getPresetRange = (preset: DateRangePreset): DateRange => {
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

    return {
      from,
      to: today,
      preset,
    }
  }

  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') {
      // If switching to custom and we have a custom date, use it
      // Otherwise, set a temporary custom range and open the calendar
      if (customDate) {
        const range: DateRange = {
          from: startOfDay(customDate),
          to: endOfDay(new Date()),
          preset: 'custom',
        }
        onChange(range)
      } else {
        // Set a temporary custom range so the Popover can render
        // Use the current value's from date or default to 30 days ago
        const tempFrom =
          value?.from || startOfDay(subDays(endOfDay(new Date()), 30))
        const range: DateRange = {
          from: tempFrom,
          to: endOfDay(new Date()),
          preset: 'custom',
        }
        onChange(range)
        setIsCustomOpen(true)
      }
      return
    }

    const range = getPresetRange(preset as DateRangePreset)
    onChange(range)
  }

  const handleCustomDateSelect = (date: Date | undefined) => {
    if (!date) return

    setCustomDate(date)
    const range: DateRange = {
      from: startOfDay(date),
      to: endOfDay(new Date()),
      preset: 'custom',
    }
    onChange(range)
    setIsCustomOpen(false)
  }

  const getDisplayValue = () => {
    if (!value) return 'Last Month'

    switch (value.preset) {
      case 'yesterday':
        return 'Yesterday'
      case 'last-week':
        return 'Last Week'
      case 'last-2-weeks':
        return 'Last 2 Weeks'
      case 'last-month':
        return 'Last Month'
      case 'custom':
        return format(value.from, 'MMM d, yyyy')
      default:
        return 'Last Month'
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select
        value={value?.preset || 'last-month'}
        onValueChange={handlePresetChange}
      >
        <SelectTrigger className='w-[180px]'>
          <SelectValue>{getDisplayValue()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='yesterday'>Yesterday</SelectItem>
          <SelectItem value='last-week'>Last Week</SelectItem>
          <SelectItem value='last-2-weeks'>Last 2 Weeks</SelectItem>
          <SelectItem value='last-month'>Last Month</SelectItem>
          <SelectItem value='custom'>Custom</SelectItem>
        </SelectContent>
      </Select>

      {value?.preset === 'custom' && (
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger asChild>
            <Button variant='outline' size='icon'>
              <CalendarIcon className='h-4 w-4' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              mode='single'
              selected={customDate}
              onSelect={handleCustomDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
