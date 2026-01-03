/**
 * Utility functions for handling timezone conversions in forms
 */

/**
 * Converts a UTC Date object to a local datetime-local input format string
 * This ensures that when editing existing data, the datetime-local input shows
 * the time in the user's local timezone rather than UTC
 */
export function utcToLocalDateTimeString(utcDate: Date): string {
  // Create a new Date object to avoid mutating the original
  const localDate = new Date(utcDate)

  // Format as YYYY-MM-DDTHH:MM for datetime-local input
  const year = localDate.getFullYear()
  const month = String(localDate.getMonth() + 1).padStart(2, '0')
  const day = String(localDate.getDate()).padStart(2, '0')
  const hours = String(localDate.getHours()).padStart(2, '0')
  const minutes = String(localDate.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}
