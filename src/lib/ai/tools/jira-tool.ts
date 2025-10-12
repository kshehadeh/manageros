import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { JiraApiService } from '@/lib/jira-api'

export const jiraTool = {
  description:
    "Search Jira issues and tickets using Jira API. Use JQL (Jira Query Language) to search for issues and when the user is interested in his own tickets, lookup who he is and use that email.  If the user is looking for another person's tickets, use the personId parameter to automatically find their Jira account link, or use the assignee parameter to filter by email/account ID directly.",
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
        'Person ID to automatically lookup their linked Jira account. Use this instead of assignee when you have a person ID from the person lookup tool.'
      ),
    assignee: z
      .string()
      .optional()
      .describe(
        'Filter by assignee (email address or account ID). Use personId instead if you have a person ID.'
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

      // If personId is provided, look up their Jira account
      let effectiveAssignee = assignee
      if (personId) {
        const personJiraAccount = await prisma.personJiraAccount.findUnique({
          where: {
            personId,
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
          throw new Error(
            `No Jira account linked for person ID: ${personId}. Please link their Jira account first.`
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
