/**
 * Utility functions for detecting and parsing priority from text input
 * Supports patterns like "!High", "!Critical", "!Medium", etc.
 */

import {
  TASK_PRIORITY,
  TASK_PRIORITY_LABELS,
  type TaskPriority,
} from '@/lib/task-priority'

export interface DetectedPriority {
  priority: TaskPriority // The detected priority value (1-5)
  originalText: string // The original text that was detected as a priority
  startIndex: number // Start position in the original text
  endIndex: number // End position in the original text
  accepted?: boolean // Whether the priority has been accepted
}

export interface PriorityDetectionResult {
  detectedPriorities: DetectedPriority[]
  cleanedText: string // Text with detected priorities removed
}

/**
 * Detects priority patterns in text
 * Supports formats like:
 * - "!Critical", "!High", "!Medium", "!Low", "!Very Low"
 * - "!critical", "!high", "!medium", "!low", "!very low" (case insensitive)
 * - "!P1", "!P2", "!P3", "!P4", "!P5" (short form)
 */
export function detectPrioritiesInText(
  text: string,
  ignoreSections?: { startIndex: number; endIndex: number }[]
): PriorityDetectionResult {
  const detectedPriorities: DetectedPriority[] = []
  let cleanedText = text

  try {
    // Create a map of all possible priority patterns
    const priorityPatterns = new Map<string, TaskPriority>()

    // Add full labels (case insensitive) - map from label to priority value
    Object.entries(TASK_PRIORITY_LABELS).forEach(([priorityValue, label]) => {
      const priority = parseInt(priorityValue) as TaskPriority
      priorityPatterns.set(`!${label.toLowerCase()}`, priority)
    })

    // Add short forms
    priorityPatterns.set('!p1', TASK_PRIORITY.CRITICAL)
    priorityPatterns.set('!p2', TASK_PRIORITY.HIGH)
    priorityPatterns.set('!p3', TASK_PRIORITY.MEDIUM)
    priorityPatterns.set('!p4', TASK_PRIORITY.LOW)
    priorityPatterns.set('!p5', TASK_PRIORITY.VERY_LOW)

    // Search for priority patterns
    for (const [pattern, priority] of priorityPatterns) {
      // Create a simple regex that matches the exact pattern
      // Escape special regex characters in the pattern
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escapedPattern, 'gi')

      let match: RegExpExecArray | null

      while ((match = regex.exec(text)) !== null) {
        // Check if this match is in an ignored section
        const isIgnored = ignoreSections?.some(
          section =>
            match!.index >= section.startIndex &&
            match!.index + match![0].length <= section.endIndex
        )

        if (!isIgnored) {
          const detectedPriority: DetectedPriority = {
            priority,
            originalText: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            accepted: false,
          }
          detectedPriorities.push(detectedPriority)
        }
      }
    }

    // Sort detected priorities by start index (descending) to remove from end first
    detectedPriorities.sort((a, b) => b.startIndex - a.startIndex)

    // Remove detected priorities from text
    detectedPriorities.forEach(detectedPriority => {
      cleanedText =
        cleanedText.slice(0, detectedPriority.startIndex) +
        cleanedText.slice(detectedPriority.endIndex)
    })

    // Clean up extra spaces
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim()
  } catch (error) {
    console.error('Error parsing priorities:', error)
    // Return original text if parsing fails
    cleanedText = text
  }

  return {
    detectedPriorities,
    cleanedText,
  }
}

/**
 * Formats a detected priority for display
 */
export function formatDetectedPriority(priority: TaskPriority): string {
  return TASK_PRIORITY_LABELS[priority]
}

/**
 * Gets the CSS variant class for a priority badge
 */
export function getPriorityBadgeVariant(priority: TaskPriority): string {
  switch (priority) {
    case TASK_PRIORITY.CRITICAL:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case TASK_PRIORITY.HIGH:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case TASK_PRIORITY.MEDIUM:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case TASK_PRIORITY.LOW:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case TASK_PRIORITY.VERY_LOW:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}
