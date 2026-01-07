import ical from 'node-ical'

export interface ParsedMeetingData {
  title: string
  description?: string
  scheduledAt: string // ISO 8601 format
  duration?: number // in minutes
  location?: string
  attendeeEmails: string[]
  organizerEmail?: string
}

/**
 * Extracts email from various ICS formats
 * Examples:
 * - "mailto:user@example.com"
 * - "MAILTO:user@example.com"
 * - "user@example.com"
 */
function extractEmail(value: string): string | null {
  if (!value) return null

  // Remove mailto: prefix if present
  const cleaned = value.replace(/^mailto:/i, '').trim()

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (emailRegex.test(cleaned)) {
    return cleaned.toLowerCase()
  }

  return null
}

/**
 * Calculates duration in minutes between two dates
 */
function calculateDuration(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime()
  return Math.round(diffMs / 60000) // Convert milliseconds to minutes
}

// Type for ICS event object (simplified from node-ical)
interface ICSEvent {
  type: string
  summary?: string
  description?: string
  location?: string
  start?: Date | string
  end?: Date | string
  duration?: number
  attendee?:
    | string
    | string[]
    | { val?: string; email?: string }
    | Array<{ val?: string; email?: string }>
  organizer?: string | { val?: string; email?: string }
}

/**
 * Parse ICS file content and extract meeting data
 */
export async function parseICSFile(
  fileContent: string
): Promise<ParsedMeetingData> {
  try {
    const events = ical.parseICS(fileContent)

    // Find the first VEVENT (meeting event)
    const event = Object.values(events).find(
      e => (e as ICSEvent).type === 'VEVENT'
    ) as ICSEvent | undefined

    if (!event) {
      throw new Error('No meeting event found in ICS file')
    }

    // Extract basic meeting details
    const title = event.summary || 'Untitled Meeting'
    const description = event.description || undefined
    const location = event.location || undefined

    // Extract and format scheduled time
    if (!event.start) {
      throw new Error('Event start time not found in ICS file')
    }

    const scheduledAt = new Date(event.start).toISOString()

    // Calculate duration
    let duration: number | undefined
    if (event.end) {
      duration = calculateDuration(new Date(event.start), new Date(event.end))
    } else if (event.duration) {
      // Duration might be specified in seconds
      duration = Math.round(event.duration / 60)
    }

    // Extract attendee emails
    const attendeeEmails: string[] = []
    if (event.attendee) {
      // attendee can be a single value or an array
      const attendees = Array.isArray(event.attendee)
        ? event.attendee
        : [event.attendee]

      for (const attendee of attendees) {
        let email: string | null = null

        if (typeof attendee === 'string') {
          email = extractEmail(attendee)
        } else if (attendee && typeof attendee === 'object') {
          // Handle complex attendee objects
          if (attendee.val) {
            email = extractEmail(attendee.val)
          } else if (attendee.email) {
            email = extractEmail(attendee.email)
          }
        }

        if (email) {
          attendeeEmails.push(email)
        }
      }
    }

    // Extract organizer email
    let organizerEmail: string | undefined
    if (event.organizer) {
      if (typeof event.organizer === 'string') {
        organizerEmail = extractEmail(event.organizer) || undefined
      } else if (event.organizer && typeof event.organizer === 'object') {
        if (event.organizer.val) {
          organizerEmail = extractEmail(event.organizer.val) || undefined
        } else if (event.organizer.email) {
          organizerEmail = extractEmail(event.organizer.email) || undefined
        }
      }
    }

    return {
      title,
      description,
      scheduledAt,
      duration,
      location,
      attendeeEmails,
      organizerEmail,
    }
  } catch (error) {
    console.error('Error parsing ICS file:', error)
    throw new Error(
      error instanceof Error
        ? `Failed to parse ICS file: ${error.message}`
        : 'Failed to parse ICS file'
    )
  }
}
