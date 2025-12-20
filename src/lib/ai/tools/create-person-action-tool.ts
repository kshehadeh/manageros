import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { teamLookupTool } from './team-lookup-tool'
import { personLookupTool } from './person-lookup-tool'
import { currentUserTool } from './current-user-tool'
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
    'Create a new person action. Use this when the user wants to create or add a new person to the organization. The tool will look up the team by name if provided, look up the manager (the person they report to) by name if provided, and return a navigation URL to the person creation form with all fields pre-filled. The tool returns an ActionResult object with a "url" field containing the relative path (e.g., "/people/new?teamId=...&managerId=...&name=..."). CRITICAL: The URL in the tool output is the ONLY source of truth - do NOT generate any additional links in text responses. The URL is already a relative path (starting with /) and should be used exactly as returned - do NOT convert it to an absolute URL or add any hostname/domain.',
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
    managerName: z
      .string()
      .optional()
      .describe(
        'The name (first, last, or full name) of the person this new person will report to (their manager). Can also be "me", "myself", "I", or the current user\'s name to indicate the new person reports to the current user. If provided, the tool will look up the manager and pre-fill it in the form.'
      ),
  }),
  execute: async ({
    personName,
    teamName,
    managerName,
  }: {
    personName?: string
    teamName?: string
    managerName?: string
  }): Promise<ActionResult> => {
    console.log('🔧 createPersonActionTool called with parameters:', {
      personName,
      teamName,
      managerName,
    })

    try {
      const user = await getCurrentUser()
      if (!user.managerOSOrganizationId) {
        throw new Error('User must belong to an organization')
      }

      let teamId: string | undefined
      let resolvedTeamName: string | undefined
      let managerId: string | undefined
      let resolvedManagerName: string | undefined

      // Look up the manager if name is provided
      if (managerName) {
        // Get current user info first to check for self-references
        const currentUserResult = await currentUserTool.execute()
        const currentUserName = currentUserResult.person.name.toLowerCase()
        const managerNameLower = managerName.toLowerCase().trim()

        // Check if managerName refers to the current user
        const selfReferences = ['me', 'myself', 'i', 'my']
        const isSelfReference =
          selfReferences.includes(managerNameLower) ||
          managerNameLower === currentUserName ||
          currentUserName.includes(managerNameLower) ||
          managerNameLower.includes(currentUserName)

        if (isSelfReference) {
          // Use current user as the manager
          managerId = currentUserResult.person.id
          resolvedManagerName = currentUserResult.person.name
        } else {
          // Look up the manager by name
          const managerLookupResult = await personLookupTool.execute({
            name: managerName,
          })

          if (!managerLookupResult.found) {
            const urlParams = new URLSearchParams()
            if (personName) {
              urlParams.set('name', personName)
            }
            const url = ensureRelativeUrl(`/people/new?${urlParams.toString()}`)
            return {
              actionType: 'navigate',
              url,
              message: `I couldn't find a manager named "${managerName}". I'll open the person creation form, and you can select the manager manually.${personName ? ` The person name "${personName}" will be pre-filled.` : ''}${teamName ? ` The team "${teamName}" will need to be selected manually.` : ''}`,
              metadata: {
                personName,
                teamName,
              },
              requiresConfirmation: false,
            }
          }

          if (managerLookupResult.disambiguationNeeded) {
            const matches = managerLookupResult.matches
              .map(m => m.name)
              .join(', ')
            const urlParams = new URLSearchParams()
            if (personName) {
              urlParams.set('name', personName)
            }
            const url = ensureRelativeUrl(`/people/new?${urlParams.toString()}`)
            return {
              actionType: 'navigate',
              url,
              message: `I found multiple people matching "${managerName}": ${matches}. I'll open the person creation form, and you can select the correct manager.${personName ? ` The person name "${personName}" will be pre-filled.` : ''}${teamName ? ` The team "${teamName}" will need to be selected manually.` : ''}`,
              metadata: {
                personName,
                teamName,
              },
              requiresConfirmation: false,
            }
          }

          // Single match found
          const matchedManager = managerLookupResult.matches[0]
          managerId = matchedManager.id
          resolvedManagerName = matchedManager.name
        }
      }

      // Look up the team if name is provided
      if (teamName) {
        const teamLookupResult = await teamLookupTool.execute({
          name: teamName,
        })

        if (!teamLookupResult.found) {
          const urlParams = new URLSearchParams()
          if (personName) {
            urlParams.set('name', personName)
          }
          if (managerId) {
            urlParams.set('managerId', managerId)
          }
          const url = ensureRelativeUrl(`/people/new?${urlParams.toString()}`)
          return {
            actionType: 'navigate',
            url,
            message: `I couldn't find a team named "${teamName}". I'll open the person creation form, and you can select the team manually.${personName ? ` The person name "${personName}" will be pre-filled.` : ''}${resolvedManagerName ? ` The manager "${resolvedManagerName}" will be pre-filled.` : ''}`,
            metadata: {
              personName,
              managerName: resolvedManagerName,
            },
            requiresConfirmation: false,
          }
        }

        if (teamLookupResult.disambiguationNeeded) {
          const matches = teamLookupResult.matches.map(m => m.name).join(', ')
          const urlParams = new URLSearchParams()
          if (personName) {
            urlParams.set('name', personName)
          }
          if (managerId) {
            urlParams.set('managerId', managerId)
          }
          const url = ensureRelativeUrl(`/people/new?${urlParams.toString()}`)
          return {
            actionType: 'navigate',
            url,
            message: `I found multiple teams matching "${teamName}": ${matches}. I'll open the person creation form, and you can select the correct team.${personName ? ` The person name "${personName}" will be pre-filled.` : ''}${resolvedManagerName ? ` The manager "${resolvedManagerName}" will be pre-filled.` : ''}`,
            metadata: {
              personName,
              managerName: resolvedManagerName,
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
      if (managerId) {
        urlParams.set('managerId', managerId)
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
      if (resolvedManagerName) {
        message += ` reporting to ${resolvedManagerName}`
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
          managerName: resolvedManagerName,
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
