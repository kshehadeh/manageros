'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface RatingSelectorProps {
  value: number | null
  onChange: (value: number) => void
  min?: number
  max?: number
  labels?: {
    min?: string
    max?: string
  }
  required?: boolean
  className?: string
}

export function RatingSelector({
  value,
  onChange,
  min = 1,
  max = 5,
  labels,
  required = false,
  className,
}: RatingSelectorProps) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className={cn('space-y-md', className)}>
      <div className='flex items-center justify-between gap-md'>
        {options.map(option => (
          <Button
            key={option}
            type='button'
            variant={value === option ? 'default' : 'outline'}
            size='lg'
            onClick={() => onChange(option)}
            className={cn(
              'flex-1 h-12 text-base font-semibold transition-all',
              value === option
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
            aria-label={`Rate ${option} out of ${max}`}
            aria-pressed={value === option}
          >
            {option}
          </Button>
        ))}
      </div>
      {(labels?.min || labels?.max) && (
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>{labels.min || ''}</span>
          <span>{labels.max || ''}</span>
        </div>
      )}
      {required && !value && (
        <p className='text-xs text-destructive mt-xs'>Please select a rating</p>
      )}
    </div>
  )
}
