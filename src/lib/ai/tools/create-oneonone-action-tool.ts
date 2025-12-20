import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { currentUserTool } from './current-user-tool'
import { personLookupTool } from './person-lookup-tool'
import * as chrono from 'chrono-node'

/**
 * Ensures a URL is relative by removing any protocol/host/domain
 * and ensuring it starts with a forward slash
 */
function ensureRelativeUrl(url: string): string {
  try {
    // If it's already a relative URL (starts with /), return as-is
    if (url.startsWith('/')) {
      return url
    }

    // If it's an absolute URL, extract the pathname
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url)
      return urlObj.pathname + urlObj.search
    }

    // If it doesn't start with /, add it
    return url.startsWith('/') ? url : `/${url}`
  } catch {
    // If URL parsing fails, ensure it starts with /
    return url.startsWith('/') ? url : `/${url}`
  }
}

export interface ActionResult {
  actionType: 'navigate' | 'create' | 'update' | 'delete'
  url?: string
  message: string
  metadata?: {
    participant1Name?: string
    participant2Name?: string
    scheduledAt?: string
    [key: string]: unknown
  }
  requiresConfirmation?: boolean
}

export const createOneOnOneActionTool = {
  description:
    'Create a 1:1 meeting action. Use this when the user wants to create or schedule a one-on-one meeting. The tool will identify the current user and the other participant, parse any date/time information, and return a navigation URL to the 1:1 creation form with all fields pre-filled. IMPORTANT: The URL returned will always be a relative path (starting with /) - do NOT convert it to an absolute URL or add any hostname/domain.',
  parameters: z.object({
    otherParticipantName: z
      .string()
      .optional()
      .describe(
        'The name (first, last, or full name) of the other participant in the 1:1 meeting. If not provided, the form will open without a pre-filled participant.'
      ),
    scheduledAt: z
      .string()
      .optional()
      .describe(
        'The date and time for the 1:1 meeting. Can be provided as natural language (e.g., "tomorrow at 2pm", "next Monday", "December 25th at 3pm") or ISO 8601 format (e.g., "2024-12-25T14:00:00Z"). If not provided, the form will default to the current date/time.'
      ),
  }),
  execute: async ({
    otherParticipantName,
    scheduledAt,
  }: {
    otherParticipantName?: string
    scheduledAt?: string
  }): Promise<ActionResult> => {
    console.log('🔧 createOneOnOneActionTool called with parameters:', {
      otherParticipantName,
      scheduledAt,
    })

    try {
      const user = await getCurrentUser()
      if (!user.managerOSOrganizationId) {
        throw new Error('User must belong to an organization')
      }

      if (!user.managerOSPersonId) {
        throw new Error('User is not linked to a person record')
      }

      // Get current user information
      const currentUserResult = await currentUserTool.execute()
      const currentUserPersonId = currentUserResult.person.id
      const currentUserName = currentUserResult.person.name

      let otherPersonId: string | undefined
      let otherPersonName: string | undefined
      const participant1Id = currentUserPersonId
      let participant2Id: string | undefined
      const participant1Name = currentUserName
      let participant2Name: string | undefined

      // Look up the other participant if name is provided
      if (otherParticipantName) {
        const personLookupResult = await personLookupTool.execute({
          name: otherParticipantName,
        })

        if (!personLookupResult.found) {
          const url = ensureRelativeUrl(
            `/oneonones/new?participant1Id=${currentUserPersonId}`
          )
          return {
            actionType: 'navigate',
            url,
            message: `I couldn't find a person named "${otherParticipantName}". I'll open the 1:1 creation form with you as participant 1, and you can select the other participant.`,
            metadata: {
              participant1Name: currentUserName,
            },
            requiresConfirmation: false,
          }
        }

        if (personLookupResult.disambiguationNeeded) {
          const matches = personLookupResult.matches.map(m => m.name).join(', ')
          const url = ensureRelativeUrl(
            `/oneonones/new?participant1Id=${currentUserPersonId}`
          )
          return {
            actionType: 'navigate',
            url,
            message: `I found multiple people matching "${otherParticipantName}": ${matches}. I'll open the 1:1 creation form with you as participant 1, and you can select the correct participant.`,
            metadata: {
              participant1Name: currentUserName,
            },
            requiresConfirmation: false,
          }
        }

        // Single match found
        const matchedPerson = personLookupResult.matches[0]
        otherPersonId = matchedPerson.id
        otherPersonName = matchedPerson.name
        participant2Id = otherPersonId
        participant2Name = otherPersonName
      }

      // Parse date/time if provided
      let parsedScheduledAt: string | undefined
      if (scheduledAt) {
        try {
          // Check if it's already an ISO 8601 string
          const isoDateRegex =
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
          if (isoDateRegex.test(scheduledAt)) {
            // Validate it's a valid date
            const date = new Date(scheduledAt)
            if (!isNaN(date.getTime())) {
              parsedScheduledAt = date.toISOString()
            }
          } else {
            // Parse natural language date/time using chrono-node
            const parsedDate = chrono.parseDate(scheduledAt)
            if (parsedDate) {
              parsedScheduledAt = parsedDate.toISOString()
            }
          }
        } catch (error) {
          console.warn('Failed to parse date/time:', scheduledAt, error)
          // Continue without pre-filled date/time
        }
      }

      // Build URL with query parameters
      const urlParams = new URLSearchParams()
      if (participant1Id) {
        urlParams.set('participant1Id', participant1Id)
      }
      if (participant2Id) {
        urlParams.set('participant2Id', participant2Id)
      }
      if (parsedScheduledAt) {
        urlParams.set('scheduledAt', parsedScheduledAt)
      }

      const url = ensureRelativeUrl(`/oneonones/new?${urlParams.toString()}`)

      // Build confirmation message
      let message = "I'll create a 1:1 meeting"
      if (participant2Name) {
        message += ` with ${participant2Name}`
      }
      if (parsedScheduledAt) {
        const date = new Date(parsedScheduledAt)
        const formattedDate = date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
        message += ` scheduled for ${formattedDate}`
      }
      message +=
        '. Click the button below to open the form with the details pre-filled.'

      return {
        actionType: 'navigate',
        url,
        message,
        metadata: {
          participant1Name,
          participant2Name,
          scheduledAt: parsedScheduledAt,
        },
        requiresConfirmation: false,
      }
    } catch (error) {
      console.error('Error in createOneOnOneActionTool:', error)
      throw error
    }
  },
}
