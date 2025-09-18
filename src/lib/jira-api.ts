/**
 * Jira API service layer for fetching work activity and user data
 */

import { decrypt } from './encryption'

export interface JiraCredentials {
  username: string
  apiKey: string
  baseUrl: string
}

export interface JiraUser {
  accountId: string
  emailAddress: string
  displayName: string
  active: boolean
}

export interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    issuetype: {
      name: string
    }
    status: {
      name: string
    }
    priority?: {
      name: string
    }
    project: {
      key: string
      name: string
    }
    assignee?: JiraUser
  }
}

export interface JiraAssignedTicket {
  issue: JiraIssue
  lastUpdated: string
  created: string
}

export class JiraApiError extends Error {
  constructor(
    message: string,
    public _statusCode?: number,
    public _response?: unknown
  ) {
    super(message)
    this.name = 'JiraApiError'
  }
}

export class JiraApiService {
  private credentials: JiraCredentials

  constructor(credentials: JiraCredentials) {
    this.credentials = credentials
  }

  /**
   * Create a JiraApiService from encrypted credentials
   */
  static fromEncryptedCredentials(
    username: string,
    encryptedApiKey: string,
    baseUrl: string
  ): JiraApiService {
    const apiKey = decrypt(encryptedApiKey)
    return new JiraApiService({ username, apiKey, baseUrl })
  }

  /**
   * Make authenticated request to Jira API
   */
  private async makeRequest<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`/rest/api/3/${endpoint}`, this.credentials.baseUrl)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    const auth = Buffer.from(
      `${this.credentials.username}:${this.credentials.apiKey}`
    ).toString('base64')

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new JiraApiError(
          `Jira API request failed: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof JiraApiError) {
        throw error
      }
      throw new JiraApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Test the connection to Jira API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('myself')
      return true
    } catch (error) {
      console.error('Jira connection test failed:', error)
      return false
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<JiraUser> {
    return this.makeRequest<JiraUser>('myself')
  }

  /**
   * Search for users by email
   */
  async searchUsersByEmail(email: string): Promise<JiraUser[]> {
    const response = await this.makeRequest<Array<JiraUser>>('user/search', {
      query: email,
      maxResults: '50',
    })
    return response.filter(
      user =>
        user.emailAddress.toLowerCase() === email.toLowerCase() && user.active
    )
  }

  /**
   * Get tickets assigned to a specific user that have been updated or created within a date range
   */
  async getUserAssignedTickets(
    accountId: string,
    fromDate: string,
    toDate: string
  ): Promise<JiraAssignedTicket[]> {
    // Search for issues assigned to the user that have been updated or created in the date range
    const jql = `assignee = "${accountId}" AND (updated >= "${fromDate}" OR created >= "${fromDate}") AND (updated <= "${toDate}" OR created <= "${toDate}") ORDER BY updated DESC`

    const response = await this.makeRequest<{
      issues: Array<{
        id: string
        key: string
        fields: {
          summary: string
          issuetype: {
            name: string
          }
          status: {
            name: string
          }
          priority?: {
            name: string
          }
          project: {
            key: string
            name: string
          }
          assignee?: JiraUser
          updated: string
          created: string
        }
      }>
    }>('search/jql', {
      jql,
      fields:
        'summary,issuetype,status,priority,project,assignee,updated,created',
      maxResults: '100',
    })

    return response.issues.map(issue => ({
      issue: {
        id: issue.id,
        key: issue.key,
        fields: issue.fields,
      },
      lastUpdated: issue.fields.updated,
      created: issue.fields.created,
    }))
  }

  /**
   * Get assigned tickets for multiple users within a date range
   */
  async getMultipleUsersAssignedTickets(
    accountIds: string[],
    fromDate: string,
    toDate: string
  ): Promise<Map<string, JiraAssignedTicket[]>> {
    const results = new Map<string, JiraAssignedTicket[]>()

    // Process users in batches to avoid overwhelming the API
    const batchSize = 5
    for (let i = 0; i < accountIds.length; i += batchSize) {
      const batch = accountIds.slice(i, i + batchSize)

      const promises = batch.map(async accountId => {
        try {
          const tickets = await this.getUserAssignedTickets(
            accountId,
            fromDate,
            toDate
          )
          results.set(accountId, tickets)
        } catch (error) {
          console.error(
            `Failed to fetch assigned tickets for user ${accountId}:`,
            error
          )
          results.set(accountId, [])
        }
      })

      await Promise.all(promises)
    }

    return results
  }
}
