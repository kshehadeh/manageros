import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { JiraApiService } from '@/lib/jira-api'

export const jiraTool = {
  description:
    "Search Jira issues and tickets using Jira API. Use JQL (Jira Query Language) to search for issues and when the user is interested in his own tickets, lookup who he is and use that email.  If the user is looking for another person's tickets, use the assignee parameter to filter by that person's email address or account ID after looking him using the people tool.",
  parameters: z.object({
    query: z
      .string()
      .describe('JQL (Jira Query Language) query to search for issues'),
    project: z
      .string()
      .optional()
      .describe('Filter by specific Jira project key'),
    status: z
      .string()
      .optional()
      .describe('Filter by issue status (e.g., "Open", "In Progress", "Done")'),
    assignee: z
      .string()
      .optional()
      .describe('Filter by assignee (email address or account ID)'),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum number of results to return (default: 50)'),
  }),
  execute: async ({
    query,
    project,
    status,
    assignee,
    limit = 50,
  }: {
    query: string
    project?: string
    status?: string
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
        query,
        project,
        status,
        assignee,
        limit
      )

      return searchResult
    } catch (error) {
      console.error('Error in Jira tool:', error)
      throw error
    }
  },
}
