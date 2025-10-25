'use client'

import {
  useState,
  useCallback,
  useMemo,
  useImperativeHandle,
  forwardRef,
  useRef,
} from 'react'
import { createEditor, Descendant, Text } from 'slate'
import {
  Slate,
  Editable,
  withReact,
  RenderLeafProps,
  ReactEditor,
} from 'slate-react'
import { withHistory } from 'slate-history'
import { Calendar, X, AlertTriangle } from 'lucide-react'
import {
  detectDatesInText,
  formatDetectedDate,
  type DetectedDate,
} from '@/lib/utils/date-detection'
import {
  detectPrioritiesInText,
  formatDetectedPriority,
  getPriorityBadgeVariant,
  type DetectedPriority,
} from '@/lib/utils/priority-detection'
import { useSlateTaskTextarea } from './slate-task-textarea-provider'

type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'

interface SlateTaskTextareaProps {
  value: string
  onChange: (_value: string) => void
  onDateDetected?: (_detectedDate: DetectedDate | null) => void
  onPriorityDetected?: (_detectedPriority: DetectedPriority | null) => void
  onSubmit?: () => void
  placeholder?: string
  className?: string
  inputClassName?: string
  textSize?: TextSize
  disabled?: boolean
}

export interface SlateTaskTextareaRef {
  focus: () => void
}

// Custom leaf component for highlighting
const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  const leafData = leaf as {
    highlight?: boolean
    highlightType?: 'date' | 'priority'
  }

  let highlightClass = ''
  if (leafData.highlight) {
    if (leafData.highlightType === 'priority') {
      highlightClass =
        'bg-red-200 text-black dark:bg-red-800 dark:text-white rounded px-0.5'
    } else {
      // Default to date highlighting
      highlightClass =
        'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-white rounded px-0.5'
    }
  }

  return (
    <span {...attributes} className={highlightClass}>
      {children}
    </span>
  )
}

// Helper function to get text size classes
const getTextSizeClass = (size: TextSize): string => {
  const sizeMap: Record<TextSize, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  }
  return sizeMap[size]
}

export const SlateTaskTextarea = forwardRef<
  SlateTaskTextareaRef,
  SlateTaskTextareaProps
>(
  (
    {
      value,
      onChange,
      onDateDetected,
      onPriorityDetected,
      onSubmit,
      placeholder = 'Enter task details...',
      className = '',
      inputClassName = '',
      textSize = 'sm',
      disabled = false,
    },
    ref
  ) => {
    const { updateText, updateDetectedDate, updateDetectedPriority } =
      useSlateTaskTextarea()
    const [detectedDates, setDetectedDates] = useState<DetectedDate[]>([])
    const [detectedPriorities, setDetectedPriorities] = useState<
      DetectedPriority[]
    >([])
    const [ignoreSections, setIgnoreSections] = useState<
      { startIndex: number; endIndex: number }[]
    >([])

    // Create editor with React and history plugins
    const editor = useMemo(() => withHistory(withReact(createEditor())), [])

    // Expose focus function to parent component
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          ReactEditor.focus(editor)
        },
      }),
      [editor]
    )

    // Decorate function to highlight detected dates and priorities
    const decorate = useCallback(
      ([node, path]: [Descendant, number[]]) => {
        const ranges: Array<{
          anchor: { path: number[]; offset: number }
          focus: { path: number[]; offset: number }
          highlight: boolean
          highlightType: 'date' | 'priority'
          date?: string
          priority?: number
        }> = []

        if (!Text.isText(node)) {
          return ranges
        }

        const { text } = node

        // Highlight detected dates
        detectedDates.forEach(detectedDate => {
          if (
            detectedDate.startIndex < text.length &&
            detectedDate.endIndex <= text.length
          ) {
            const isIgnored = ignoreSections.some(
              ignoredSection =>
                detectedDate.startIndex >= ignoredSection.startIndex &&
                detectedDate.endIndex <= ignoredSection.endIndex
            )

            if (!isIgnored) {
              ranges.push({
                anchor: { path, offset: detectedDate.startIndex },
                focus: { path, offset: detectedDate.endIndex },
                highlight: true,
                highlightType: 'date',
                date: detectedDate.date,
              })
            }
          }
        })

        // Highlight detected priorities
        detectedPriorities.forEach(detectedPriority => {
          if (
            detectedPriority.startIndex < text.length &&
            detectedPriority.endIndex <= text.length
          ) {
            const isIgnored = ignoreSections.some(
              ignoredSection =>
                detectedPriority.startIndex >= ignoredSection.startIndex &&
                detectedPriority.endIndex <= ignoredSection.endIndex
            )

            if (!isIgnored) {
              ranges.push({
                anchor: { path, offset: detectedPriority.startIndex },
                focus: { path, offset: detectedPriority.endIndex },
                highlight: true,
                highlightType: 'priority',
                priority: detectedPriority.priority,
              })
            }
          }
        })

        return ranges
      },
      [detectedDates, detectedPriorities, ignoreSections]
    )

    // Convert string value to Slate value
    const slateValue: Descendant[] = useMemo(() => {
      if (!value) {
        return [{ type: 'paragraph', children: [{ text: '' }] }]
      }
      return [{ type: 'paragraph', children: [{ text: value }] }]
    }, [value])

    // Track if the editor is currently being updated by user input
    const isUserInputRef = useRef(false)

    // Immediate detection for both dates and priorities
    const detectInText = useCallback(
      (text: string) => {
        const dateResult = detectDatesInText(text, ignoreSections)
        const priorityResult = detectPrioritiesInText(text, ignoreSections)

        // Store detected items for display
        setDetectedDates(dateResult.detectedDates)
        setDetectedPriorities(priorityResult.detectedPriorities)

        // Update provider with detected data
        const latestDetectedDate =
          dateResult.detectedDates.length > 0
            ? dateResult.detectedDates[dateResult.detectedDates.length - 1]
            : null
        updateDetectedDate(latestDetectedDate)

        const latestDetectedPriority =
          priorityResult.detectedPriorities.length > 0
            ? priorityResult.detectedPriorities[
                priorityResult.detectedPriorities.length - 1
              ]
            : null
        updateDetectedPriority(latestDetectedPriority)

        // Notify parent component about detected date
        if (onDateDetected) {
          onDateDetected(latestDetectedDate)
        }

        // Notify parent component about detected priority
        if (onPriorityDetected) {
          onPriorityDetected(latestDetectedPriority)
        }
      },
      [
        onDateDetected,
        onPriorityDetected,
        ignoreSections,
        updateDetectedDate,
        updateDetectedPriority,
      ]
    )

    // Handle removing a detected date
    const handleRemoveDate = useCallback(
      (indexToRemove: number) => {
        setDetectedDates(prevDates => {
          const dateToRemove = prevDates[indexToRemove]

          // Add to ignore sections
          setIgnoreSections(prevSections => [
            ...prevSections,
            {
              startIndex: dateToRemove.startIndex,
              endIndex: dateToRemove.endIndex,
            },
          ])

          const newDates = prevDates.filter(
            (_, index) => index !== indexToRemove
          )

          // Update provider with latest date after removal
          const latestDetectedDate =
            newDates.length > 0 ? newDates[newDates.length - 1] : null
          updateDetectedDate(latestDetectedDate)

          // Notify parent component about the latest date after removal
          if (onDateDetected) {
            onDateDetected(latestDetectedDate)
          }

          return newDates
        })
      },
      [onDateDetected, updateDetectedDate]
    )

    // Handle removing a detected priority
    const handleRemovePriority = useCallback(
      (indexToRemove: number) => {
        setDetectedPriorities(prevPriorities => {
          const priorityToRemove = prevPriorities[indexToRemove]

          // Add to ignore sections
          setIgnoreSections(prevSections => [
            ...prevSections,
            {
              startIndex: priorityToRemove.startIndex,
              endIndex: priorityToRemove.endIndex,
            },
          ])

          const newPriorities = prevPriorities.filter(
            (_, index) => index !== indexToRemove
          )

          // Update provider with latest priority after removal
          const latestDetectedPriority =
            newPriorities.length > 0
              ? newPriorities[newPriorities.length - 1]
              : null
          updateDetectedPriority(latestDetectedPriority)

          // Notify parent component about the latest priority after removal
          if (onPriorityDetected) {
            onPriorityDetected(latestDetectedPriority)
          }

          return newPriorities
        })
      },
      [onPriorityDetected, updateDetectedPriority]
    )

    // Handle editor changes
    const handleChange = useCallback(
      (newValue: Descendant[]) => {
        // Mark that this change is from user input
        isUserInputRef.current = true

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

        // Check if any changes occurred within ignored sections and remove them
        if (ignoreSections.length > 0) {
          setIgnoreSections(prevIgnoreSections => {
            return prevIgnoreSections.filter(ignoredSection => {
              // Check if the ignored section still exists in the current text
              // and hasn't been modified
              const sectionText = value.slice(
                ignoredSection.startIndex,
                ignoredSection.endIndex
              )
              const newSectionText = text.slice(
                ignoredSection.startIndex,
                ignoredSection.endIndex
              )

              // If the section text has changed or the section is out of bounds, remove it
              return (
                sectionText === newSectionText &&
                ignoredSection.startIndex < text.length &&
                ignoredSection.endIndex <= text.length
              )
            })
          })
        }

        // Update provider with original text
        updateText(text)

        // Pass original text to parent (no cleaning here)
        onChange(text)

        // Trigger detection immediately on text change
        if (text.trim()) {
          detectInText(text)
        } else {
          setDetectedDates([])
          setDetectedPriorities([])
          updateDetectedDate(null)
          updateDetectedPriority(null)
          if (onDateDetected) {
            onDateDetected(null)
          }
          if (onPriorityDetected) {
            onPriorityDetected(null)
          }
        }
      },
      [
        onChange,
        detectInText,
        onDateDetected,
        onPriorityDetected,
        ignoreSections,
        value,
        updateText,
        updateDetectedDate,
        updateDetectedPriority,
      ]
    )

    // Handle key events for Shift + Enter submission and Tab navigation
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && event.shiftKey && onSubmit) {
          event.preventDefault()
          onSubmit()
        }
        // Allow Tab key to work for keyboard navigation
        // By not preventing default, the browser will handle tab navigation naturally
      },
      [onSubmit]
    )

    return (
      <div
        className={`border border-input bg-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${className}`}
      >
        <div className='relative'>
          <div
            className='px-3 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
            style={{ minHeight: '2.5rem' }}
            tabIndex={0}
            onFocus={() => {
              // When the wrapper is focused via tab, focus the Slate editor
              ReactEditor.focus(editor)
            }}
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
                className={`outline-none resize-none ${getTextSizeClass(textSize)} ${inputClassName}`}
                style={{ minHeight: '1.5rem' }}
                onKeyDown={handleKeyDown}
              />
            </Slate>
          </div>
        </div>

        {/* Status area for detected dates and priorities - always reserve space */}
        <div className='px-3 pb-2 min-h-[2rem] bg-muted/30'>
          {(detectedDates.length > 0 || detectedPriorities.length > 0) && (
            <div className='flex flex-wrap gap-2'>
              {/* Show detected dates */}
              {detectedDates.map((detectedDate, index) => (
                <div
                  key={`detected-date-${index}`}
                  className='flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md text-sm'
                >
                  <Calendar className='h-3 w-3' />
                  <span>{formatDetectedDate(detectedDate.date)}</span>
                  <button
                    type='button'
                    onClick={() => handleRemoveDate(index)}
                    className='ml-1 p-0.5 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors'
                    title='Dismiss date'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </div>
              ))}

              {/* Show detected priorities */}
              {detectedPriorities.map((detectedPriority, index) => (
                <div
                  key={`detected-priority-${index}`}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm ${getPriorityBadgeVariant(detectedPriority.priority)}`}
                >
                  <AlertTriangle className='h-3 w-3' />
                  <span>
                    {formatDetectedPriority(detectedPriority.priority)}
                  </span>
                  <button
                    type='button'
                    onClick={() => handleRemovePriority(index)}
                    className='ml-1 p-0.5 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors'
                    title='Dismiss priority'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
)

SlateTaskTextarea.displayName = 'SlateTaskTextarea'
