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

/**
 * Converts a local datetime-local input string to a UTC Date object
 * This ensures that form submissions are properly converted to UTC for storage
 */
export function localDateTimeStringToUtc(localDateTimeString: string): Date {
  // The datetime-local input provides a string in YYYY-MM-DDTHH:MM format
  // We need to create a Date object that represents this local time
  // and then convert it to UTC for storage
  return new Date(localDateTimeString)
}

/**
 * Gets the current local date and time formatted for datetime-local input
 * Rounds to the nearest 15 minutes for better UX
 */
export function getCurrentLocalDateTimeString(): string {
  const now = new Date()

  // Round to the nearest 15 minutes
  const minutes = now.getMinutes()
  const roundedMinutes = Math.round(minutes / 15) * 15
  const roundedDate = new Date(now)
  roundedDate.setMinutes(roundedMinutes, 0, 0)

  return utcToLocalDateTimeString(roundedDate)
}
