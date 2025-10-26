'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { type DetectedDate } from '@/lib/utils/date-detection'
import { type DetectedPriority } from '@/lib/utils/priority-detection'

interface TaskSummaryInputContextValue {
  // Original text as typed by the user
  originalText: string
  // Cleaned text with detected dates/priorities removed
  cleanedText: string
  // Detected data
  detectedDate: DetectedDate | null
  detectedPriority: DetectedPriority | null
  // Actions
  updateText: (text: string) => void
  updateDetectedDate: (date: DetectedDate | null) => void
  updateDetectedPriority: (priority: DetectedPriority | null) => void
  getCleanedText: () => string
  reset: () => void
}

const TaskSummaryInputContext =
  createContext<TaskSummaryInputContextValue | null>(null)

export function useTaskSummaryInput() {
  const context = useContext(TaskSummaryInputContext)
  if (!context) {
    throw new Error(
      'useTaskSummaryInput must be used within a TaskSummaryInputProvider'
    )
  }
  return context
}

interface TaskSummaryInputProviderProps {
  children: ReactNode
  onDateDetected?: (detectedDate: DetectedDate | null) => void
  onPriorityDetected?: (detectedPriority: DetectedPriority | null) => void
}

export function TaskSummaryInputProvider({
  children,
  onDateDetected,
  onPriorityDetected,
}: TaskSummaryInputProviderProps) {
  const [originalText, setOriginalText] = useState('')
  const [detectedDate, setDetectedDate] = useState<DetectedDate | null>(null)
  const [detectedPriority, setDetectedPriority] =
    useState<DetectedPriority | null>(null)

  const updateText = useCallback((text: string) => {
    setOriginalText(text)
  }, [])

  const updateDetectedDate = useCallback(
    (date: DetectedDate | null) => {
      setDetectedDate(date)
      onDateDetected?.(date)
    },
    [onDateDetected]
  )

  const updateDetectedPriority = useCallback(
    (priority: DetectedPriority | null) => {
      setDetectedPriority(priority)
      onPriorityDetected?.(priority)
    },
    [onPriorityDetected]
  )

  const getCleanedText = useCallback(() => {
    let cleanedText = originalText

    // Remove detected date text if present
    if (detectedDate?.originalText) {
      cleanedText = cleanedText.replace(detectedDate.originalText, '')
    }

    // Remove detected priority text if present
    if (detectedPriority?.originalText) {
      cleanedText = cleanedText.replace(detectedPriority.originalText, '')
    }

    // Clean up extra whitespace
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim()

    return cleanedText
  }, [originalText, detectedDate, detectedPriority])

  const reset = useCallback(() => {
    setOriginalText('')
    setDetectedDate(null)
    setDetectedPriority(null)
  }, [])

  const value: TaskSummaryInputContextValue = {
    originalText,
    cleanedText: getCleanedText(),
    detectedDate,
    detectedPriority,
    updateText,
    updateDetectedDate,
    updateDetectedPriority,
    getCleanedText,
    reset,
  }

  return (
    <TaskSummaryInputContext.Provider value={value}>
      {children}
    </TaskSummaryInputContext.Provider>
  )
}
