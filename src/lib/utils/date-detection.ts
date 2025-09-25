/**
 * Utility functions for detecting and parsing dates from text input using chrono-node
 */

import * as chrono from 'chrono-node'

export interface DetectedDate {
  date: string // Full ISO datetime string (YYYY-MM-DDTHH:mm:ss.sssZ)
  originalText: string // The original text that was detected as a date
  startIndex: number // Start position in the original text
  endIndex: number // End position in the original text
  dateOnly?: string // Date-only string (YYYY-MM-DD) for backward compatibility
}

export interface DateDetectionResult {
  detectedDates: DetectedDate[]
  cleanedText: string // Text with detected dates removed
}

/**
 * Detects various date patterns in text and extracts them using chrono-node
 * Supports formats like:
 * - "tomorrow", "today", "next week", "next month"
 * - "Jan 15", "January 15", "1/15", "15/1"
 * - "Jan 15 2024", "January 15, 2024"
 * - "2024-01-15", "01/15/2024"
 * - "next Monday", "this Friday"
 * - "a week from today", "in 3 days", "5 days from now"
 */
export function detectDatesInText(text: string): DateDetectionResult {
  const detectedDates: DetectedDate[] = []
  let cleanedText = text

  try {
    // Use chrono-node to parse dates with a default morning reference time (9 AM)
    // This ensures relative dates like "tomorrow" default to morning instead of current time
    const referenceDate = new Date()
    referenceDate.setHours(9, 0, 0, 0) // Set to 9 AM
    const parsedResults = chrono.parse(text, referenceDate)

    // Convert chrono results to our format
    parsedResults.forEach(result => {
      if (result.start && result.text) {
        const dateObj = result.start.date()
        // Use the full ISO datetime string as the primary date field
        const fullDateTime = dateObj.toISOString()

        // Also provide date-only string for backward compatibility
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const day = String(dateObj.getDate()).padStart(2, '0')
        const dateOnlyString = `${year}-${month}-${day}`

        const detectedDate: DetectedDate = {
          date: fullDateTime, // Full ISO datetime for Prisma
          originalText: result.text,
          startIndex: result.index,
          endIndex: result.index + result.text.length,
          dateOnly: dateOnlyString, // Date-only for backward compatibility
        }
        detectedDates.push(detectedDate)
      }
    })

    // Sort detected dates by start index (descending) to remove from end first
    detectedDates.sort((a, b) => b.startIndex - a.startIndex)

    // Remove detected dates from text
    detectedDates.forEach(detectedDate => {
      cleanedText =
        cleanedText.slice(0, detectedDate.startIndex) +
        cleanedText.slice(detectedDate.endIndex)
    })

    // Clean up extra spaces
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim()
  } catch (error) {
    console.error('Error parsing dates with chrono-node:', error)
    // Return original text if parsing fails
    cleanedText = text
  }

  return {
    detectedDates,
    cleanedText,
  }
}

/**
 * Formats a detected date for display - always shows the actual date and time
 */
export function formatDetectedDate(date: string): string {
  // The date field now contains the full ISO datetime string
  const dateObj = new Date(date)
  const today = new Date()

  // Always show the actual date and time
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }

  // Include year if it's different from current year
  if (dateObj.getFullYear() !== today.getFullYear()) {
    options.year = 'numeric'
  }

  return dateObj.toLocaleDateString('en-US', options)
}
