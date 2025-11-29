/**
 * Jira API service layer for fetching work activity and user data
 */

import 'server-only'
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
  avatarUrls?: {
    '48x48': string
    '24x24': string
    '16x16': string
    '32x32': string
  }
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
      statusCategory?: {
        key: string
        name: string
      }
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
      if (error instanceof JiraApiError) {
        throw error
      }
      throw new JiraApiError(
        error instanceof Error
          ? error.message
          : 'Connection test failed. Please check your credentials.'
      )
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
   * Get user details by account ID (includes avatar URLs)
   */
  async getUserByAccountId(accountId: string): Promise<JiraUser> {
    return this.makeRequest<JiraUser>(`user?accountId=${accountId}`)
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
            statusCategory?: {
              key: string
              name: string
            }
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
        'summary,issuetype,status,statuscategory,priority,project,assignee,updated,created',
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
   * Search for tickets based on project, status, assignee, or any combination
   */
  async searchTickets(
    query?: string,
    project?: string,
    statusCategory?: string[],
    status?: string,
    assignee?: string,
    limit: number = 50
  ): Promise<{
    totalCount: number
    results: Array<{
      id: string
      key: string
      summary: string
      description?: string
      issueType: {
        name: string
        iconUrl?: string
      }
      status: {
        name: string
        color?: string
      }
      statusCategory?: string[]
      priority?: {
        name: string
        iconUrl?: string
      }
      project: {
        key: string
        name: string
      }
      assignee?: {
        accountId: string
        displayName: string
        emailAddress: string
        avatarUrl?: string
      }
      reporter?: {
        accountId: string
        displayName: string
        emailAddress: string
        avatarUrl?: string
      }
      created: string
      updated: string
      labels: string[]
      fixVersions: Array<{
        name: string
        released: boolean
      }>
      components: Array<{
        name: string
        description?: string
      }>
      webUrl: string
    }>
    jqlQuery: string
    project: string
    status: string
    statusCategory: string[] | string
    assignee: string
  }> {
    // Build JQL query by collecting all WHERE clauses
    const whereClauses: string[] = []

    // Add base query if specified
    if (query) {
      whereClauses.push(query)
    }

    // Add project filter if specified
    if (project) {
      whereClauses.push(`project = "${project}"`)
    }

    // Add status filter if specified
    if (status) {
      whereClauses.push(`status = "${status}"`)
    }

    // Add status category filter if specified
    if (statusCategory && statusCategory.length > 0) {
      whereClauses.push(
        `statusCategory in (${statusCategory.map(status => `"${status}"`).join(',')})`
      )
    }

    // Add assignee filter if specified
    if (assignee) {
      // Check if it's an email address or account ID
      if (assignee.includes('@')) {
        whereClauses.push(`assignee in (${assignee})`)
      } else {
        whereClauses.push(`assignee = "${assignee}"`)
      }
    }

    // Join all clauses with AND
    const jqlQuery = whereClauses.join(' AND ')

    const response = await this.makeRequest<{
      total: number
      issues: Array<{
        id: string
        key: string
        fields: {
          summary: string
          description?: string
          issuetype?: { name: string; iconUrl?: string }
          status?: { name: string; statusCategory?: { colorName: string } }
          statusCategory?: string[]
          priority?: { name: string; iconUrl?: string }
          project?: { key: string; name: string }
          assignee?: {
            accountId: string
            displayName: string
            emailAddress: string
            avatarUrls?: { '48x48': string }
          }
          reporter?: {
            accountId: string
            displayName: string
            emailAddress: string
            avatarUrls?: { '48x48': string }
          }
          created: string
          updated: string
          labels?: string[]
          fixVersions?: Array<{ name: string; released: boolean }>
          components?: Array<{ name: string; description?: string }>
        }
      }>
    }>('search/jql', {
      jql: jqlQuery,
      fields: '*all',
      maxResults: limit.toString(),
    })

    const results = response.issues.map(issue => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
      issueType: {
        name: issue.fields.issuetype?.name || 'Unknown',
        iconUrl: issue.fields.issuetype?.iconUrl,
      },
      status: {
        name: issue.fields.status?.name || 'Unknown',
        color: issue.fields.status?.statusCategory?.colorName,
      },
      statusCategory: issue.fields.statusCategory,
      priority: issue.fields.priority
        ? {
            name: issue.fields.priority.name,
            iconUrl: issue.fields.priority.iconUrl,
          }
        : undefined,
      project: {
        key: issue.fields.project?.key || 'Unknown',
        name: issue.fields.project?.name || 'Unknown',
      },
      assignee: issue.fields.assignee
        ? {
            accountId: issue.fields.assignee.accountId,
            displayName: issue.fields.assignee.displayName,
            emailAddress: issue.fields.assignee.emailAddress,
            avatarUrl: issue.fields.assignee.avatarUrls?.['48x48'],
          }
        : undefined,
      reporter: issue.fields.reporter
        ? {
            accountId: issue.fields.reporter.accountId,
            displayName: issue.fields.reporter.displayName,
            emailAddress: issue.fields.reporter.emailAddress,
            avatarUrl: issue.fields.reporter.avatarUrls?.['48x48'],
          }
        : undefined,
      created: issue.fields.created,
      updated: issue.fields.updated,
      labels: issue.fields.labels || [],
      fixVersions:
        issue.fields.fixVersions?.map(version => ({
          name: version.name,
          released: version.released,
        })) || [],
      components:
        issue.fields.components?.map(component => ({
          name: component.name,
          description: component.description,
        })) || [],
      webUrl: `${this.credentials.baseUrl}/browse/${issue.key}`,
    }))

    return {
      totalCount: response.total,
      results,
      jqlQuery,
      project: project || 'All projects',
      status: status || 'All statuses',
      statusCategory: statusCategory || 'All statuses',
      assignee: assignee || 'All assignees',
    }
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
