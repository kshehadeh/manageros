/**
 * Jira integration wrapper
 * Supports both organization-level and user-level integrations
 * Wraps existing JiraApiService for backward compatibility
 */

import 'server-only'
import { JiraApiService, type JiraUser } from '@/lib/jira-api'
import {
  BaseIntegrationImpl,
  type ExternalEntity,
  type SearchQuery,
  type IntegrationScope,
} from './base-integration'

export class JiraIntegration extends BaseIntegrationImpl {
  private jiraService: JiraApiService | null = null

  getType() {
    return 'jira' as const
  }

  getScope(): IntegrationScope {
    return this.config.scope
  }

  /**
   * Get or create Jira API service instance
   */
  private getJiraService(): JiraApiService {
    if (!this.jiraService) {
      const credentials = this.getCredentials()
      this.jiraService = JiraApiService.fromEncryptedCredentials(
        credentials.jiraUsername,
        credentials.encryptedApiKey,
        credentials.jiraBaseUrl
      )
    }
    return this.jiraService
  }

  /**
   * Get decrypted credentials
   */
  private getCredentials(): {
    jiraUsername: string
    encryptedApiKey: string
    jiraBaseUrl: string
  } {
    const creds = this.config.encryptedCredentials as {
      jiraUsername?: string
      encryptedApiKey?: string
      jiraBaseUrl?: string
    }

    if (!creds.jiraUsername || !creds.encryptedApiKey || !creds.jiraBaseUrl) {
      throw new Error('Invalid Jira credentials configuration')
    }

    return {
      jiraUsername: creds.jiraUsername,
      encryptedApiKey: creds.encryptedApiKey,
      jiraBaseUrl: creds.jiraBaseUrl,
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const service = this.getJiraService()
      return await service.testConnection()
    } catch (error) {
      console.error('Jira connection test failed:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Connection test failed. Please check your credentials.'
      throw new Error(errorMessage)
    }
  }

  async searchEntities(query: SearchQuery): Promise<ExternalEntity[]> {
    const service = this.getJiraService()

    // Search for Jira users by email or query
    if (query.query) {
      try {
        // Try to search by email first
        const users = await service.searchUsersByEmail(query.query)
        return users.map(user => this.jiraUserToExternalEntity(user))
      } catch {
        // If email search fails, return empty array
        return []
      }
    }

    return []
  }

  async getEntityById(id: string): Promise<ExternalEntity | null> {
    const service = this.getJiraService()

    try {
      const user = await service.getUserByAccountId(id)
      return this.jiraUserToExternalEntity(user)
    } catch {
      return null
    }
  }

  /**
   * Convert Jira user to ExternalEntity
   */
  private jiraUserToExternalEntity(user: JiraUser): ExternalEntity {
    const baseUrl = this.getCredentials().jiraBaseUrl
    return {
      id: user.accountId,
      title: user.displayName,
      description: user.emailAddress,
      url: `${baseUrl}/people/${user.accountId}`,
      metadata: {
        email: user.emailAddress,
        displayName: user.displayName,
        active: user.active,
        avatarUrls: user.avatarUrls,
      },
    }
  }

  /**
   * Search for Jira users by email (helper method)
   */
  async searchUsersByEmail(email: string): Promise<JiraUser[]> {
    const service = this.getJiraService()
    return await service.searchUsersByEmail(email)
  }

  /**
   * Get user by account ID (helper method for avatars, etc.)
   */
  async getUserByAccountId(accountId: string): Promise<JiraUser | null> {
    const service = this.getJiraService()
    try {
      return await service.getUserByAccountId(accountId)
    } catch {
      return null
    }
  }

  /**
   * Get user tickets (helper method for backward compatibility)
   */
  async getUserTickets(accountId: string, fromDate: string, toDate: string) {
    const service = this.getJiraService()
    return await service.getUserAssignedTickets(accountId, fromDate, toDate)
  }
}
