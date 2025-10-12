import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { JiraApiService } from '@/lib/jira-api'

export const jiraTool = {
  description:
    "Search Jira issues and tickets using Jira API. IMPORTANT: When the user asks about 'my tickets', 'my issues', or anything related to their own work, DO NOT provide a personId - the tool will automatically use the current user's linked Jira account. Only provide personId when searching for another specific person's tickets.",
  parameters: z.object({
    project: z
      .string()
      .optional()
      .describe('Filter by specific Jira project key'),
    statusCategory: z
      .array(z.enum(['Open', 'In Progress', 'Done']))
      .optional()
      .describe(
        'Filter by issue status category (e.g., "Open", "In Progress", "Done").  For example, when someone says they want to find "unfinished tickets that means they are looking for "open" and "in progress" tickets.  If they look for "completed" that means "Done".'
      ),
    personId: z
      .string()
      .optional()
      .describe(
        "Person ID to lookup their linked Jira account. ONLY use this when searching for ANOTHER person's tickets (not the current user). If omitted, automatically uses the current user's linked Jira account."
      ),
    assignee: z
      .string()
      .optional()
      .describe(
        'Filter by assignee (email address or account ID). Use this only for direct assignee filtering. If you want to search by person, use personId instead.'
      ),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum number of results to return (default: 50)'),
  }),
  execute: async ({
    project,
    statusCategory,
    personId,
    assignee,
    limit = 50,
  }: {
    project?: string
    statusCategory?: string[]
    personId?: string
    assignee?: string
    limit?: number
  }) => {
    try {
      const user = await getCurrentUser()
      if (!user.organizationId) {
        throw new Error(
          'User must belong to an organization to use Jira integration'
        )
      }

      // Get user's Jira credentials
      const credentials = await prisma.userJiraCredentials.findUnique({
        where: { userId: user.id },
      })

      if (!credentials) {
        throw new Error(
          'Jira credentials not configured. Please set up Jira integration in Settings.'
        )
      }

      // Determine which person to search for
      let effectiveAssignee = assignee
      let targetPersonId = personId

      // If no personId provided, try to use current user's linked person
      if (!targetPersonId && !assignee) {
        if (user.personId) {
          targetPersonId = user.personId
        }
      }

      // If we have a personId (either provided or from current user), look up their Jira account
      if (targetPersonId) {
        const personJiraAccount = await prisma.personJiraAccount.findUnique({
          where: {
            personId: targetPersonId,
          },
          include: {
            person: {
              select: {
                name: true,
                organizationId: true,
              },
            },
          },
        })

        if (!personJiraAccount) {
          const personName =
            targetPersonId === user.personId ? 'You' : 'This person'
          throw new Error(
            `${personName} do not have a Jira account linked. Please link a Jira account first in Settings.`
          )
        }

        // Verify the person belongs to the same organization
        if (personJiraAccount.person.organizationId !== user.organizationId) {
          throw new Error(
            'You can only look up Jira accounts for people in your organization'
          )
        }

        // Use the Jira account ID from the linked account
        effectiveAssignee = personJiraAccount.jiraAccountId
      }

      // Create Jira API service
      const jiraService = JiraApiService.fromEncryptedCredentials(
        credentials.jiraUsername,
        credentials.encryptedApiKey,
        credentials.jiraBaseUrl
      )

      // Test connection
      const isConnected = await jiraService.testConnection()
      if (!isConnected) {
        throw new Error(
          'Failed to connect to Jira. Please check your credentials.'
        )
      }

      // Use the JiraApiService to search for tickets
      const searchResult = await jiraService.searchTickets(
        undefined, // query (not used, we use statusCategory instead)
        project,
        statusCategory,
        undefined, // status (not used, we use statusCategory instead)
        effectiveAssignee,
        limit
      )

      return searchResult
    } catch (error) {
      console.error('Error in Jira tool:', error)
      throw error
    }
  },
}
