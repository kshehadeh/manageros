'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, X, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface InlineEditableDateProps {
  value: Date | null
  onValueChange: (_value: Date | null) => Promise<void>
  placeholder?: string
  className?: string
  disabled?: boolean
  emptyStateText?: string
}

export function InlineEditableDate({
  value,
  onValueChange,
  placeholder = 'Select date',
  className,
  disabled = false,
  emptyStateText = 'Click to set date',
}: InlineEditableDateProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<Date | null>(value)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Update edit value when value prop changes
  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleStartEdit = () => {
    if (disabled || isLoading) return
    setEditValue(value)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (editValue === value || isLoading) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onValueChange(editValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update date:', error)
      // Reset to original value on error
      setEditValue(value)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    if (inputValue === '') {
      setEditValue(null)
    } else {
      // Try to parse the date
      const parsedDate = new Date(inputValue)
      if (!isNaN(parsedDate.getTime())) {
        setEditValue(parsedDate)
      }
    }
  }

  const formatDateForInput = (date: Date | null) => {
    if (!date) return ''
    return format(date, 'yyyy-MM-dd')
  }

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return ''
    return format(date, 'MMM dd, yyyy')
  }

  if (isEditing) {
    return (
      <div className={cn('w-full', className)}>
        <div className='flex items-center gap-2 w-full'>
          <Input
            ref={inputRef}
            type='date'
            value={formatDateForInput(editValue)}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className='flex-1 min-w-0 h-8 text-sm'
          />
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
