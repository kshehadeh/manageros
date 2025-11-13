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
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
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
import { useIsMobile } from '@/lib/hooks/use-media-query'

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
  dateOnly?: boolean // If true, only show date selection without time
}

export function DateTimePickerWithNaturalInput({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  error = false,
  label,
  required = false,
  shortFormat = false,
  dateOnly = false,
}: DateTimePickerWithNaturalInputProps) {
  // Set default placeholder based on dateOnly mode
  const defaultPlaceholder = dateOnly ? 'Pick a date' : 'Pick a date and time'
  const finalPlaceholder = placeholder || defaultPlaceholder

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
    // For date-only mode, default to midnight (12:00 AM)
    // For datetime mode, default to 9:00 AM
    return dateOnly
      ? { hours: '12', minutes: '00', period: 'AM' }
      : { hours: '09', minutes: '00', period: 'AM' }
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
      // Reset time to default based on dateOnly mode
      setSelectedTime(
        dateOnly
          ? { hours: '12', minutes: '00', period: 'AM' }
          : { hours: '09', minutes: '00', period: 'AM' }
      )
    }
  }, [value, dateOnly])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = event.target.value
    setInputValue(inputVal)

    // Try to parse natural language input
    const parsedDate = chrono.parseDate(inputVal)
    if (parsedDate) {
      const hours24 = parsedDate.getHours()
      const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24
      setSelectedDate(parsedDate)

      // For date-only mode, always set time to midnight
      if (dateOnly) {
        setSelectedTime({
          hours: '12',
          minutes: '00',
          period: 'AM',
        })
        updateDateTime(parsedDate, 0, 0) // Set to midnight
      } else {
        setSelectedTime({
          hours: hours12.toString().padStart(2, '0'),
          minutes: parsedDate.getMinutes().toString().padStart(2, '0'),
          period: hours24 >= 12 ? 'PM' : 'AM',
        })
        updateDateTime(parsedDate, hours24, parsedDate.getMinutes())
      }
    }
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue) {
      // Try to parse the current input value
      const parsedDate = chrono.parseDate(inputValue)
      if (parsedDate) {
        // Date was successfully recognized, close the popup
        setOpen(false)
        setInputValue('') // Clear the input for next time
      }
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)

      // For date-only mode, always set time to midnight
      if (dateOnly) {
        setSelectedTime({
          hours: '12',
          minutes: '00',
          period: 'AM',
        })
        updateDateTime(date, 0, 0) // Set to midnight
      } else {
        const hours24 = convertTo24Hour(
          parseInt(selectedTime.hours),
          selectedTime.period
        )
        updateDateTime(date, hours24, parseInt(selectedTime.minutes))
      }
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
    if (!selectedDate) return finalPlaceholder
    const dateFormat = shortFormat ? 'MMM dd' : 'PPP'

    if (dateOnly) {
      return format(selectedDate, dateFormat)
    } else {
      return (
        format(selectedDate, dateFormat) +
        ' at ' +
        `${selectedTime.hours}:${selectedTime.minutes} ${selectedTime.period}`
      )
    }
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

  const isMobile = useIsMobile()

  const triggerButton = (
    <Button
      variant='outline'
      className={cn(
        'w-full justify-start text-left font-normal',
        !selectedDate && 'text-muted-foreground',
        error && 'border-destructive'
      )}
      disabled={disabled}
    >
      <CalendarIcon className='mr-md h-4 w-4' />
      {formatDisplayValue()}
    </Button>
  )

  const pickerContent = (
    <div className='p-lg flex flex-col'>
      {/* Natural language input */}
      <Input
        placeholder={
          dateOnly
            ? "e.g., 'tomorrow', 'next Monday'"
            : "e.g., 'tomorrow at 2pm', 'next Monday'"
        }
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        className='text-sm mb-lg'
      />

      {/* Calendar and Time selection side by side on desktop, stacked on mobile */}
      <div className='flex flex-col md:flex-row gap-xl flex-1 md:flex-initial'>
        {/* Calendar */}
        <Calendar
          mode='single'
          captionLayout='dropdown'
          selected={selectedDate}
          onSelect={handleDateSelect}
          fromYear={new Date().getFullYear() - 20}
          toYear={new Date().getFullYear() + 10}
          className='rounded-md border [--cell-size:1.5rem] mx-auto md:mx-0'
        />

        {/* Time selection - only show if not in dateOnly mode */}
        {selectedDate && !dateOnly && (
          <div className='flex flex-col gap-lg w-full md:w-auto md:min-w-[200px]'>
            <div className='space-y-md'>
              <Label className='text-xs text-muted-foreground'>Time</Label>
              <div className='flex gap-md'>
                <div className='flex-1'>
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
            </div>

            {/* Quick time buttons */}
            <div className='space-y-lg'>
              <div className='space-y-sm'>
                <Label className='text-xs text-muted-foreground'>
                  Quick Times
                </Label>
                <div className='grid grid-cols-2 gap-sm'>
                  {[
                    {
                      time: '9 AM',
                      hours: '09',
                      minutes: '00',
                      period: 'AM',
                    },
                    {
                      time: '12 PM',
                      hours: '12',
                      minutes: '00',
                      period: 'PM',
                    },
                    {
                      time: '2 PM',
                      hours: '02',
                      minutes: '00',
                      period: 'PM',
                    },
                    {
                      time: '4 PM',
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
                          updateDateTime(
                            selectedDate,
                            hours24,
                            parseInt(minutes)
                          )
                        }
                      }}
                    >
                      <Clock className='mr-sm h-3 w-3' />
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quick date buttons */}
              <div className='space-y-sm'>
                <Label className='text-xs text-muted-foreground'>
                  Quick Dates
                </Label>
                <div className='grid grid-cols-1 gap-sm'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 text-xs justify-start'
                    onClick={() => {
                      // Tomorrow morning at 9am
                      const tomorrow = new Date()
                      tomorrow.setDate(tomorrow.getDate() + 1)
                      setSelectedDate(tomorrow)
                      setSelectedTime({
                        hours: '09',
                        minutes: '00',
                        period: 'AM',
                      })
                      updateDateTime(tomorrow, 9, 0)
                    }}
                  >
                    <CalendarIcon className='mr-sm h-3 w-3' />
                    Tomorrow morning
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 text-xs justify-start'
                    onClick={() => {
                      // Next week (Monday after current date at 9am)
                      const today = new Date()
                      const daysUntilNextMonday =
                        (7 - today.getDay() + 1) % 7 || 7
                      const nextMonday = new Date(today)
                      nextMonday.setDate(today.getDate() + daysUntilNextMonday)
                      setSelectedDate(nextMonday)
                      setSelectedTime({
                        hours: '09',
                        minutes: '00',
                        period: 'AM',
                      })
                      updateDateTime(nextMonday, 9, 0)
                    }}
                  >
                    <CalendarIcon className='mr-sm h-3 w-3' />
                    Next week
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 text-xs justify-start'
                    onClick={() => {
                      // First Monday of next month at 9am
                      const today = new Date()
                      const nextMonth = new Date(
                        today.getFullYear(),
                        today.getMonth() + 1,
                        1
                      )
                      // Find first Monday of the month
                      const dayOfWeek = nextMonth.getDay()
                      const daysUntilMonday =
                        dayOfWeek === 0
                          ? 1
                          : dayOfWeek === 1
                            ? 0
                            : 8 - dayOfWeek
                      nextMonth.setDate(nextMonth.getDate() + daysUntilMonday)
                      setSelectedDate(nextMonth)
                      setSelectedTime({
                        hours: '09',
                        minutes: '00',
                        period: 'AM',
                      })
                      updateDateTime(nextMonth, 9, 0)
                    }}
                  >
                    <CalendarIcon className='mr-sm h-3 w-3' />
                    Next month
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={cn('space-y-md', className)}>
      {label && (
        <Label className={cn(error && 'text-destructive')}>
          {label} {required && <span className='text-destructive'>*</span>}
        </Label>
      )}

      {isMobile ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>{triggerButton}</DialogTrigger>
          <DialogContent className='p-0 h-[100vh] max-h-[100vh] flex flex-col overflow-y-auto rounded-none left-0 top-0 translate-x-0 translate-y-0'>
            {pickerContent}
          </DialogContent>
        </Dialog>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            {pickerContent}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
