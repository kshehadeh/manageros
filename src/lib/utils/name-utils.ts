/**
 * Combines first and last name into a single name string
 * Handles cases where one or both names may be null or undefined
 * @param firstName - The first name (may be null or undefined)
 * @param lastName - The last name (may be null or undefined)
 * @returns A combined name string, or empty string if both are missing
 */
export function combineName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const first = firstName?.trim() || ''
  const last = lastName?.trim() || ''

  if (!first && !last) {
    return ''
  }

  if (!first) {
    return last
  }

  if (!last) {
    return first
  }

  return `${first} ${last}`
}
