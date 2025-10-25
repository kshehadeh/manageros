'use client'

import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropdownOption {
  value: string | number
  label: string
  variant?: string
}

interface InlineEditableDropdownProps {
  value: string | number
  options: DropdownOption[]
  onValueChange: (_value: string | number) => Promise<void>
  getVariant?: (_value: string | number) => string
  getLabel?: (_value: string | number) => string
  className?: string
  disabled?: boolean
}

export function InlineEditableDropdown({
  value,
  options,
  onValueChange,
  getLabel,
  className,
  disabled = false,
}: InlineEditableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const currentOption = options.find(option => option.value === value)
  const currentLabel = getLabel
    ? getLabel(value)
    : currentOption?.label || String(value)

  const handleValueChange = async (newValue: string | number) => {
    if (newValue === value || isLoading) return

    setIsLoading(true)
    try {
      await onValueChange(newValue)
    } catch (error) {
      console.error('Failed to update value:', error)
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <span className='text-sm font-medium'>{currentLabel}</span>
          <ChevronDown className='h-3 w-3 text-muted-foreground' />
        </div>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-48 p-1'>
        <div className='space-y-1'>
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => handleValueChange(option.value)}
              className={cn(
                'w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-sm',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                'transition-colors'
              )}
            >
              <div className='flex items-center gap-2'>
                <span className='text-sm'>{option.label}</span>
              </div>
              {option.value === value && (
                <Check className='h-4 w-4 text-primary' />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
