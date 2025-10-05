'use client'

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useImperativeHandle,
  forwardRef,
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
import { Calendar, X } from 'lucide-react'
import {
  detectDatesInText,
  formatDetectedDate,
  type DetectedDate,
} from '@/lib/utils/date-detection'

interface SlateTaskTextareaProps {
  value: string
  onChange: (_value: string) => void
  onDateDetected?: (_detectedDate: DetectedDate | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  rows?: number
}

export interface SlateTaskTextareaRef {
  focus: () => void
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

export const SlateTaskTextarea = forwardRef<
  SlateTaskTextareaRef,
  SlateTaskTextareaProps
>(
  (
    {
      value,
      onChange,
      onDateDetected,
      placeholder = 'Enter task details...',
      className = '',
      disabled = false,
      rows = 4,
    },
    ref
  ) => {
    const [detectedDates, setDetectedDates] = useState<DetectedDate[]>([])
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

    // Decorate function to highlight detected dates (uses existing detectedDates state)
    const decorate = useCallback(
      ([node, path]: [Descendant, number[]]) => {
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

        // Use existing detected dates instead of re-detecting
        detectedDates.forEach(detectedDate => {
          // Only highlight if the detected date is within the current text node bounds
          if (
            detectedDate.startIndex < text.length &&
            detectedDate.endIndex <= text.length
          ) {
            // Check if this date range is in the ignored sections
            const isIgnored = ignoreSections.some(
              ignoredSection =>
                detectedDate.startIndex >= ignoredSection.startIndex &&
                detectedDate.endIndex <= ignoredSection.endIndex
            )

            // Only highlight if not ignored
            if (!isIgnored) {
              ranges.push({
                anchor: { path, offset: detectedDate.startIndex },
                focus: { path, offset: detectedDate.endIndex },
                highlight: true,
                date: detectedDate.date,
              })
            }
          }
        })

        return ranges
      },
      [detectedDates, ignoreSections]
    )

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
          const result = detectDatesInText(text, ignoreSections)

          // Store detected dates for display
          setDetectedDates(result.detectedDates)

          // Notify parent component about detected date
          if (onDateDetected) {
            const latestDetectedDate =
              result.detectedDates.length > 0
                ? result.detectedDates[result.detectedDates.length - 1]
                : null
            onDateDetected(latestDetectedDate)
          }
        }, 300)

        return () => clearTimeout(timeoutId)
      },
      [onDateDetected, ignoreSections]
    )

    // Handle removing a detected date
    const handleRemoveDate = useCallback(
      (indexToRemove: number) => {
        setDetectedDates(prevDates => {
          setIgnoreSections(prevSections => [
            ...prevSections,
            {
              startIndex: prevDates[indexToRemove].startIndex,
              endIndex: prevDates[indexToRemove].endIndex,
            },
          ])
          const newDates = prevDates.filter(
            (_, index) => index !== indexToRemove
          )

          // Notify parent component about the latest date after removal
          if (onDateDetected) {
            const latestDetectedDate =
              newDates.length > 0 ? newDates[newDates.length - 1] : null
            onDateDetected(latestDetectedDate)
          }

          return newDates
        })
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
      [onChange, debouncedDetectDates, onDateDetected, ignoreSections, value]
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
            </div>
          </div>
        )}
      </div>
    )
  }
)

SlateTaskTextarea.displayName = 'SlateTaskTextarea'
