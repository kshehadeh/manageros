'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createEditor, Descendant, Text } from 'slate'
import { Slate, Editable, withReact, RenderLeafProps } from 'slate-react'
import { withHistory } from 'slate-history'
import { Calendar } from 'lucide-react'
import {
  detectDatesInText,
  formatDetectedDate,
  type DetectedDate,
} from '@/lib/utils/date-detection'

interface SlateTaskTextareaProps {
  value: string
  onChange: (_value: string) => void
  onDateDetected?: (_date: string | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  rows?: number
}

// Custom leaf component for highlighting
const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  return (
    <span
      {...attributes}
      className={
        (leaf as { highlight?: boolean }).highlight
          ? 'bg-yellow-200 dark:bg-yellow-800 rounded px-0.5'
          : ''
      }
    >
      {children}
    </span>
  )
}

// Decorate function to highlight detected dates
const decorate = ([node, path]: [Descendant, number[]]) => {
  const ranges: Array<{
    anchor: { path: number[]; offset: number }
    focus: { path: number[]; offset: number }
    highlight: boolean
    date: string
  }> = []

  if (!Text.isText(node)) {
    return ranges
  }

  const { text } = node

  // Detect dates in the text
  const result = detectDatesInText(text)

  result.detectedDates.forEach(detectedDate => {
    ranges.push({
      anchor: { path, offset: detectedDate.startIndex },
      focus: { path, offset: detectedDate.endIndex },
      highlight: true,
      date: detectedDate.date,
    })
  })

  return ranges
}

export function SlateTaskTextarea({
  value,
  onChange,
  onDateDetected,
  placeholder = 'Enter task details...',
  className = '',
  disabled = false,
  rows = 4,
}: SlateTaskTextareaProps) {
  const [detectedDates, setDetectedDates] = useState<DetectedDate[]>([])

  // Create editor with React and history plugins
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])

  // Convert string value to Slate value
  const slateValue: Descendant[] = useMemo(() => {
    if (!value) {
      return [{ type: 'paragraph', children: [{ text: '' }] }]
    }
    return [{ type: 'paragraph', children: [{ text: value }] }]
  }, [value])

  // Force editor to update when value changes externally
  useEffect(() => {
    const newValue = slateValue
    if (JSON.stringify(editor.children) !== JSON.stringify(newValue)) {
      editor.children = newValue
      editor.selection = null
    }
  }, [editor, slateValue])

  // Debounced date detection
  const debouncedDetectDates = useCallback(
    (text: string) => {
      const timeoutId = setTimeout(() => {
        const result = detectDatesInText(text)

        // Store detected dates for display
        setDetectedDates(result.detectedDates)

        // Notify parent component about detected date
        if (onDateDetected) {
          const latestDate =
            result.detectedDates.length > 0
              ? result.detectedDates[result.detectedDates.length - 1].date
              : null
          onDateDetected(latestDate)
        }
      }, 300)

      return () => clearTimeout(timeoutId)
    },
    [onDateDetected]
  )

  // Handle editor changes
  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      // Extract text from Slate's nested structure
      const text = newValue
        .map((node: Descendant) => {
          if ('children' in node && node.children) {
            return node.children
              .map((child: Descendant) =>
                'text' in child ? child.text || '' : ''
              )
              .join('')
          }
          return ''
        })
        .join('\n')

      onChange(text)

      // Trigger date detection directly on text change
      if (text.trim()) {
        debouncedDetectDates(text)
      } else {
        setDetectedDates([])
        if (onDateDetected) {
          onDateDetected(null)
        }
      }
    },
    [onChange, debouncedDetectDates, onDateDetected]
  )

  return (
    <div className={`space-y-3 ${className}`}>
      <div className='relative'>
        <div
          className={`min-h-[${rows * 1.5}rem] border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md`}
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          <Slate
            editor={editor}
            initialValue={slateValue}
            onChange={handleChange}
          >
            <Editable
              renderLeaf={Leaf}
              decorate={decorate}
              placeholder={placeholder}
              disabled={disabled}
              className='outline-none resize-none'
              style={{ minHeight: `${rows * 1.5}rem` }}
            />
          </Slate>
        </div>
      </div>

      {/* Status area for detected dates */}
      {detectedDates.length > 0 && (
        <div className='space-y-2'>
          <div className='flex flex-wrap gap-2'>
            {/* Show detected dates */}
            {detectedDates.map((detectedDate, index) => (
              <div
                key={`detected-${index}`}
                className='flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md text-sm'
              >
                <Calendar className='h-3 w-3' />
                <span>{formatDetectedDate(detectedDate.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
