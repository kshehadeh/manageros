'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Calendar, X } from 'lucide-react'
import {
  detectDatesInText,
  formatDetectedDate,
  type DetectedDate,
} from '@/lib/utils/date-detection'

interface EnhancedTaskInputProps {
  value: string
  onChange: (_value: string) => void
  onDateDetected?: (_date: string | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showDatePreview?: boolean
  showInlineDate?: boolean
}

export function EnhancedTaskInput({
  value,
  onChange,
  onDateDetected,
  placeholder = 'Enter task title...',
  className = '',
  disabled = false,
  showDatePreview = false,
  showInlineDate = true,
}: EnhancedTaskInputProps) {
  const [detectedDates, setDetectedDates] = useState<DetectedDate[]>([])
  const [isDetecting, setIsDetecting] = useState(false)

  // Debounced date detection
  const debouncedDetectDates = useCallback(
    (text: string) => {
      const timeoutId = setTimeout(() => {
        setIsDetecting(true)
        const result = detectDatesInText(text)
        setDetectedDates(result.detectedDates)

        // Notify parent component about detected date
        if (onDateDetected) {
          const latestDate =
            result.detectedDates.length > 0
              ? result.detectedDates[result.detectedDates.length - 1].date
              : null
          onDateDetected(latestDate)
        }

        setIsDetecting(false)
      }, 300)

      return () => clearTimeout(timeoutId)
    },
    [onDateDetected]
  )

  // Detect dates when value changes
  useEffect(() => {
    if (value.trim()) {
      debouncedDetectDates(value)
    } else {
      setDetectedDates([])
      if (onDateDetected) {
        onDateDetected(null)
      }
    }
  }, [value, debouncedDetectDates, onDateDetected])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const removeDetectedDate = (index: number) => {
    const dateToRemove = detectedDates[index]
    const beforeDate = value.slice(0, dateToRemove.startIndex)
    const afterDate = value.slice(dateToRemove.endIndex)
    const newValue = (beforeDate + afterDate).replace(/\s+/g, ' ').trim()
    onChange(newValue)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className='relative'>
        <Input
          type='text'
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className='pr-8'
        />

        {/* Hidden span for text measurement */}
        <span
          className='absolute invisible whitespace-pre'
          style={{
            fontSize: '14px',
            fontFamily: 'inherit',
            padding: '8px',
            border: '1px solid transparent',
          }}
        >
          {value}
        </span>

        {/* Highlight overlay for detected dates */}
        {detectedDates.length > 0 && (
          <div className='absolute inset-0 pointer-events-none'>
            <div className='relative h-full'>
              {detectedDates.map((detectedDate, index) => {
                const beforeText = value.slice(0, detectedDate.startIndex)
                const highlightedText = detectedDate.originalText

                // Use a simpler approach - estimate based on character count
                // This is approximate but should work reasonably well
                const charWidth = 8.5 // Approximate character width in pixels
                const beforeWidth = beforeText.length * charWidth
                const highlightWidth = highlightedText.length * charWidth

                return (
                  <div
                    key={index}
                    className='absolute top-0 h-full bg-primary/20 rounded-sm border border-primary/30'
                    style={{
                      left: `${beforeWidth + 8}px`, // 8px for input padding
                      width: `${highlightWidth}px`,
                      height: 'calc(100% - 2px)', // Account for border
                      top: '1px',
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}

        {isDetecting && (
          <div className='absolute right-2 top-1/2 transform -translate-y-1/2'>
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-foreground'></div>
          </div>
        )}
        {!isDetecting && detectedDates.length > 0 && showInlineDate && (
          <div className='absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none'>
            <span className='text-sm text-muted-foreground bg-background px-1'>
              {formatDetectedDate(detectedDates[detectedDates.length - 1].date)}
            </span>
          </div>
        )}
      </div>

      {showDatePreview && detectedDates.length > 0 && (
        <div className='space-y-2'>
          <div className='text-sm text-muted-foreground flex items-center gap-1'>
            <Calendar className='h-4 w-4' />
            <span>Detected dates:</span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {detectedDates.map((detectedDate, index) => (
              <div
                key={index}
                className='flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm'
              >
                <span>{formatDetectedDate(detectedDate.date)}</span>
                <button
                  type='button'
                  onClick={() => removeDetectedDate(index)}
                  className='hover:bg-primary/20 rounded-full p-0.5'
                  disabled={disabled}
                >
                  <X className='h-3 w-3' />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
