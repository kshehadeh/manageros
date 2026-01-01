/**
 * Utility functions for formatting dates for display
 */

import { format } from 'date-fns'

/**
 * Formats a date for display with shortened format (no year if current year)
 * @param date - The date to format (Date object or null)
 * @returns Formatted date string or null if date is null
 * @example
 * formatShortDate(new Date('2024-01-15')) // "Jan 15" (if current year)
 * formatShortDate(new Date('2023-01-15')) // "Jan 15, 2023" (if different year)
 */
export function formatShortDate(date: Date | null): string | null {
  if (!date) return null
  const dateObj = new Date(date)
  const today = new Date()

  // Include year only if it's different from current year
  if (dateObj.getFullYear() !== today.getFullYear()) {
    return format(dateObj, 'MMM d, yyyy')
  }
  return format(dateObj, 'MMM d')
}
