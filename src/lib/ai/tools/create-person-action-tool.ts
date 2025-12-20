import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { teamLookupTool } from './team-lookup-tool'
import type { ActionResult } from './create-oneonone-action-tool'

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

export const createPersonActionTool = {
  description:
    'Create a new person action. Use this when the user wants to create or add a new person to the organization. The tool will look up the team by name if provided, and return a navigation URL to the person creation form with all fields pre-filled. IMPORTANT: The URL returned will always be a relative path (starting with /) - do NOT convert it to an absolute URL or add any hostname/domain.',
  parameters: z.object({
    personName: z
      .string()
      .optional()
      .describe(
        'The name (first, last, or full name) of the person to create. If not provided, the form will open without a pre-filled name.'
      ),
    teamName: z
      .string()
      .optional()
      .describe(
        'The name of the team the person belongs to. If provided, the tool will look up the team and pre-fill it in the form.'
      ),
  }),
  execute: async ({
    personName,
    teamName,
  }: {
    personName?: string
    teamName?: string
  }): Promise<ActionResult> => {
    console.log('🔧 createPersonActionTool called with parameters:', {
      personName,
      teamName,
    })

    try {
      const user = await getCurrentUser()
      if (!user.managerOSOrganizationId) {
        throw new Error('User must belong to an organization')
      }

      let teamId: string | undefined
      let resolvedTeamName: string | undefined

      // Look up the team if name is provided
      if (teamName) {
        const teamLookupResult = await teamLookupTool.execute({
          name: teamName,
        })

        if (!teamLookupResult.found) {
          const urlParams = new URLSearchParams()
          if (personName) {
            // Note: The form doesn't accept name as a query param, but we can mention it in the message
          }
          const url = ensureRelativeUrl(`/people/new?${urlParams.toString()}`)
          return {
            actionType: 'navigate',
            url,
            message: `I couldn't find a team named "${teamName}". I'll open the person creation form, and you can select the team manually.${personName ? ` The person name "${personName}" will need to be entered in the form.` : ''}`,
            metadata: {
              personName,
            },
            requiresConfirmation: false,
          }
        }

        if (teamLookupResult.disambiguationNeeded) {
          const matches = teamLookupResult.matches.map(m => m.name).join(', ')
          const urlParams = new URLSearchParams()
          const url = ensureRelativeUrl(`/people/new?${urlParams.toString()}`)
          return {
            actionType: 'navigate',
            url,
            message: `I found multiple teams matching "${teamName}": ${matches}. I'll open the person creation form, and you can select the correct team.${personName ? ` The person name "${personName}" will need to be entered in the form.` : ''}`,
            metadata: {
              personName,
            },
            requiresConfirmation: false,
          }
        }

        // Single match found
        const matchedTeam = teamLookupResult.matches[0]
        teamId = matchedTeam.id
        resolvedTeamName = matchedTeam.name
      }

      // Build URL with query parameters
      const urlParams = new URLSearchParams()
      if (teamId) {
        urlParams.set('teamId', teamId)
      }
      if (personName) {
        urlParams.set('name', personName)
      }

      const url = ensureRelativeUrl(`/people/new?${urlParams.toString()}`)

      // Build confirmation message
      let message = "I'll create a new person"
      if (personName) {
        message += ` named ${personName}`
      }
      if (resolvedTeamName) {
        message += ` on the ${resolvedTeamName} team`
      }
      message +=
        '. Click the button below to open the form with the details pre-filled.'

      return {
        actionType: 'navigate',
        url,
        message,
        metadata: {
          personName,
          teamName: resolvedTeamName,
        },
        requiresConfirmation: false,
      }
    } catch (error) {
      console.error('Error in createPersonActionTool:', error)
      throw error
    }
  },
}
