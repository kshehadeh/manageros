'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'

export interface MultiSelectOption {
  label: string
  value: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (_selected: string[]) => void
  placeholder?: string
  maxDisplay?: number
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  maxDisplay = 2,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleToggle = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const selectedOptions = options.filter(option =>
    selected.includes(option.value)
  )

  const displayText = React.useMemo(() => {
    if (selected.length === 0) {
      return placeholder
    }
    if (selected.length <= maxDisplay) {
      return selectedOptions.map(option => option.label).join(', ')
    }
    return `${selected.length} selected`
  }, [selected, selectedOptions, maxDisplay, placeholder])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          <span className='truncate'>{displayText}</span>
          <div className='flex items-center gap-md'>
            {selected.length > 0 && (
              <X
                className='h-4 w-4 shrink-0 opacity-50 hover:opacity-100'
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
        <div className='max-h-64 overflow-y-auto p-sm'>
          {options.map(option => (
            <div
              key={option.value}
              className='flex items-center space-x-md rounded-sm px-md py-md cursor-pointer hover:bg-accent'
              onClick={() => handleToggle(option.value)}
            >
              <Checkbox
                checked={selected.includes(option.value)}
                onCheckedChange={() => handleToggle(option.value)}
              />
              <label className='flex-1 text-sm cursor-pointer'>
                {option.label}
              </label>
              {selected.includes(option.value) && (
                <Check className='h-4 w-4 text-primary' />
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
