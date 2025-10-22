'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { DateTimePickerWithNaturalInput } from '@/components/ui/datetime-picker-with-natural-input'

interface InlineEditableDateProps {
  value: Date | null
  onValueChange: (_value: Date | null) => Promise<void>
  placeholder?: string
  className?: string
  disabled?: boolean
  emptyStateText?: string
  showTime?: boolean
  shortFormat?: boolean
}

export function InlineEditableDate({
  value,
  onValueChange,
  placeholder = 'Select date',
  className,
  disabled = false,
  emptyStateText = 'Click to set date',
  showTime = false,
  shortFormat = false,
}: InlineEditableDateProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string>(
    value ? value.toISOString() : ''
  )
  const [isLoading, setIsLoading] = useState(false)

  // Update edit value when value prop changes
  useEffect(() => {
    setEditValue(value ? value.toISOString() : '')
  }, [value])

  const handleStartEdit = () => {
    if (disabled || isLoading) return
    setEditValue(value ? value.toISOString() : '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    const newDate = editValue ? new Date(editValue) : null
    if (newDate === value || isLoading) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onValueChange(newDate)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update date:', error)
      // Reset to original value on error
      setEditValue(value ? value.toISOString() : '')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value ? value.toISOString() : '')
    setIsEditing(false)
  }

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return ''
    if (shortFormat) {
      return showTime ? format(date, 'MMM dd, h:mm a') : format(date, 'MMM dd')
    }
    return showTime
      ? format(date, 'MMM dd, yyyy h:mm a')
      : format(date, 'MMM dd, yyyy')
  }

  if (isEditing) {
    return (
      <div className={cn('w-full', className)}>
        <div className='flex items-center gap-2 w-full'>
          <div className='flex-1 min-w-0'>
            <DateTimePickerWithNaturalInput
              value={editValue}
              onChange={setEditValue}
              placeholder={placeholder}
              disabled={isLoading}
              className='h-8'
              shortFormat={shortFormat}
            />
          </div>
          <Button
            size='sm'
            onClick={handleSave}
            disabled={isLoading}
            className='h-8 w-8 p-0 flex-shrink-0'
          >
            <Check className='h-3 w-3' />
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={handleCancel}
            disabled={isLoading}
            className='h-8 w-8 p-0 flex-shrink-0'
          >
            <X className='h-3 w-3' />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group cursor-pointer rounded-md px-1 py-0.5 -mx-1 -my-0.5 hover:bg-muted/50 transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={handleStartEdit}
    >
      <div className='flex items-center justify-between'>
        <div className='flex-1 min-w-0'>
          {value ? (
            <div className='text-sm font-medium'>
              {formatDateForDisplay(value)}
            </div>
          ) : (
            <div className='text-sm text-muted-foreground italic'>
              {emptyStateText}
            </div>
          )}
        </div>
        <Edit2 className='h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0' />
      </div>
    </div>
  )
}
