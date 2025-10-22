'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import * as chrono from 'chrono-node'

interface DateTimePickerWithNaturalInputProps {
  value?: string // ISO string format
  onChange: (_value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: boolean
  label?: string
  required?: boolean
  shortFormat?: boolean
}

export function DateTimePickerWithNaturalInput({
  value,
  onChange,
  placeholder = 'Pick a date and time',
  className,
  disabled = false,
  error = false,
  label,
  required = false,
  shortFormat = false,
}: DateTimePickerWithNaturalInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [selectedTime, setSelectedTime] = React.useState<{
    hours: string
    minutes: string
    period: 'AM' | 'PM'
  }>(() => {
    if (value) {
      const date = new Date(value)
      const hours24 = date.getHours()
      const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24
      return {
        hours: hours12.toString().padStart(2, '0'),
        minutes: date.getMinutes().toString().padStart(2, '0'),
        period: hours24 >= 12 ? 'PM' : 'AM',
      }
    }
    return { hours: '09', minutes: '00', period: 'AM' }
  })

  // Update selected date when value prop changes
  React.useEffect(() => {
    if (value) {
      const date = new Date(value)
      const hours24 = date.getHours()
      const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24
      setSelectedDate(date)
      setSelectedTime({
        hours: hours12.toString().padStart(2, '0'),
        minutes: date.getMinutes().toString().padStart(2, '0'),
        period: hours24 >= 12 ? 'PM' : 'AM',
      })
    } else {
      setSelectedDate(undefined)
    }
  }, [value])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = event.target.value
    setInputValue(inputVal)

    // Try to parse natural language input
    const parsedDate = chrono.parseDate(inputVal)
    if (parsedDate) {
      const hours24 = parsedDate.getHours()
      const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24
      setSelectedDate(parsedDate)
      setSelectedTime({
        hours: hours12.toString().padStart(2, '0'),
        minutes: parsedDate.getMinutes().toString().padStart(2, '0'),
        period: hours24 >= 12 ? 'PM' : 'AM',
      })
      updateDateTime(parsedDate, hours24, parsedDate.getMinutes())
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      const hours24 = convertTo24Hour(
        parseInt(selectedTime.hours),
        selectedTime.period
      )
      updateDateTime(date, hours24, parseInt(selectedTime.minutes))
    }
  }

  const convertTo24Hour = (hours12: number, period: 'AM' | 'PM'): number => {
    if (period === 'AM') {
      return hours12 === 12 ? 0 : hours12
    } else {
      return hours12 === 12 ? 12 : hours12 + 12
    }
  }

  const handleTimeChange = (
    type: 'hours' | 'minutes' | 'period',
    value: string
  ) => {
    const newTime = { ...selectedTime, [type]: value }
    setSelectedTime(newTime)

    if (selectedDate) {
      const hours24 = convertTo24Hour(parseInt(newTime.hours), newTime.period)
      updateDateTime(selectedDate, hours24, parseInt(newTime.minutes))
    }
  }

  const updateDateTime = (date: Date, hours: number, minutes: number) => {
    const newDateTime = new Date(date)
    newDateTime.setHours(hours, minutes, 0, 0)
    onChange(newDateTime.toISOString())
  }

  const formatDisplayValue = () => {
    if (!selectedDate) return placeholder
    const dateFormat = shortFormat ? 'MMM dd' : 'PPP'
    return (
      format(selectedDate, dateFormat) +
      ' at ' +
      `${selectedTime.hours}:${selectedTime.minutes} ${selectedTime.period}`
    )
  }

  const generateTimeOptions = (type: 'hours' | 'minutes') => {
    const options = []
    if (type === 'hours') {
      // Generate 12-hour format (1-12)
      for (let i = 1; i <= 12; i++) {
        const value = i.toString().padStart(2, '0')
        options.push(
          <SelectItem key={value} value={value}>
            {value}
          </SelectItem>
        )
      }
    } else {
      // Generate minutes (0-59 in 15-minute intervals)
      for (let i = 0; i <= 59; i += 15) {
        const value = i.toString().padStart(2, '0')
        options.push(
          <SelectItem key={value} value={value}>
            {value}
          </SelectItem>
        )
      }
    }
    return options
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className={cn(error && 'text-destructive')}>
          {label} {required && <span className='text-destructive'>*</span>}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground',
              error && 'border-destructive'
            )}
            disabled={disabled}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {formatDisplayValue()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <div className='p-3 space-y-3'>
            {/* Natural language input */}
            <Input
              placeholder="e.g., 'next Monday', 'tomorrow at 2pm', 'in 3 days'"
              value={inputValue}
              onChange={handleInputChange}
              className='text-sm'
            />

            {/* Calendar */}
            <Calendar
              mode='single'
              captionLayout='dropdown'
              selected={selectedDate}
              onSelect={handleDateSelect}
              className='rounded-md border [--cell-size:1.5rem]'
            />

            {/* Time selection */}
            {selectedDate && (
              <div className='flex gap-2'>
                <div className='flex-1'>
                  <Label className='text-xs text-muted-foreground'>Hour</Label>
                  <Select
                    value={selectedTime.hours}
                    onValueChange={value => handleTimeChange('hours', value)}
                  >
                    <SelectTrigger className='h-8'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeOptions('hours')}
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex-1'>
                  <Label className='text-xs text-muted-foreground'>
                    Minute
                  </Label>
                  <Select
                    value={selectedTime.minutes}
                    onValueChange={value => handleTimeChange('minutes', value)}
                  >
                    <SelectTrigger className='h-8'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeOptions('minutes')}
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex-1'>
                  <Label className='text-xs text-muted-foreground'>
                    Period
                  </Label>
                  <Select
                    value={selectedTime.period}
                    onValueChange={value => handleTimeChange('period', value)}
                  >
                    <SelectTrigger className='h-8'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='AM'>AM</SelectItem>
                      <SelectItem value='PM'>PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Quick time buttons */}
            {selectedDate && (
              <div className='grid grid-cols-2 gap-1'>
                {[
                  {
                    time: '09:00 AM',
                    hours: '09',
                    minutes: '00',
                    period: 'AM',
                  },
                  {
                    time: '12:00 PM',
                    hours: '12',
                    minutes: '00',
                    period: 'PM',
                  },
                  {
                    time: '02:00 PM',
                    hours: '02',
                    minutes: '00',
                    period: 'PM',
                  },
                  {
                    time: '04:00 PM',
                    hours: '04',
                    minutes: '00',
                    period: 'PM',
                  },
                ].map(({ time, hours, minutes, period }) => (
                  <Button
                    key={time}
                    variant='outline'
                    size='sm'
                    className='h-7 text-xs'
                    onClick={() => {
                      setSelectedTime({
                        hours,
                        minutes,
                        period: period as 'AM' | 'PM',
                      })
                      if (selectedDate) {
                        const hours24 = convertTo24Hour(
                          parseInt(hours),
                          period as 'AM' | 'PM'
                        )
                        updateDateTime(selectedDate, hours24, parseInt(minutes))
                      }
                    }}
                  >
                    <Clock className='mr-1 h-3 w-3' />
                    {time}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
