/**
 * GitHub integration wrapper
 * Supports both organization-level and user-level integrations
 * Wraps existing GithubApiService for backward compatibility
 */

import 'server-only'
import { GithubApiService, type GithubUser } from '@/lib/github-api'
import {
  BaseIntegrationImpl,
  type ExternalEntity,
  type SearchQuery,
  type IntegrationScope,
} from './base-integration'

export class GithubIntegration extends BaseIntegrationImpl {
  private githubService: GithubApiService | null = null

  getType() {
    return 'github' as const
  }

  getScope(): IntegrationScope {
    return this.config.scope
  }

  /**
   * Get or create GitHub API service instance
   */
  private getGithubService(): GithubApiService {
    if (!this.githubService) {
      const credentials = this.getCredentials()
      this.githubService = GithubApiService.fromEncryptedCredentials(
        credentials.githubUsername,
        credentials.encryptedPat
      )
    }
    return this.githubService
  }

  /**
   * Get decrypted credentials
   */
  private getCredentials(): {
    githubUsername: string
    encryptedPat: string
  } {
    const creds = this.config.encryptedCredentials as {
      githubUsername?: string
      encryptedPat?: string
    }

    if (!creds.githubUsername || !creds.encryptedPat) {
      throw new Error('Invalid GitHub credentials configuration')
    }

    return {
      githubUsername: creds.githubUsername,
      encryptedPat: creds.encryptedPat,
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const service = this.getGithubService()
      return await service.testConnection()
    } catch (error) {
      console.error('GitHub connection test failed:', error)
      return false
    }
  }

  async searchEntities(query: SearchQuery): Promise<ExternalEntity[]> {
    const service = this.getGithubService()

    // Search for GitHub users by username
    if (query.query) {
      try {
        const user = await service.getUserByUsername(query.query)
        if (user) {
          return [this.githubUserToExternalEntity(user)]
        }
      } catch {
        // If user search fails, return empty array
        return []
      }
    }

    return []
  }

  async getEntityById(id: string): Promise<ExternalEntity | null> {
    const service = this.getGithubService()

    try {
      // GitHub user ID is numeric, but we might receive username
      // Try as username first
      const user = await service.getUserByUsername(id)
      if (user) {
        return this.githubUserToExternalEntity(user)
      }
    } catch {
      // If lookup fails, return null
    }

    return null
  }

  /**
   * Convert GitHub user to ExternalEntity
   */
  private githubUserToExternalEntity(user: GithubUser): ExternalEntity {
    return {
      id: user.login,
      title: user.name || user.login,
      description: user.email || undefined,
      url: user.htmlUrl,
      metadata: {
        login: user.login,
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    }
  }

  /**
   * Get user by username (helper method)
   */
  async getUserByUsername(username: string): Promise<GithubUser | null> {
    const service = this.getGithubService()
    return await service.getUserByUsername(username)
  }

  /**
   * Get user pull requests (helper method for backward compatibility)
   */
  async getUserPullRequests(
    username: string,
    daysBack: number,
    allowedOrganizations?: string[]
  ) {
    const service = this.getGithubService()
    return await service.getRecentPullRequests(
      username,
      daysBack,
      allowedOrganizations
    )
  }
}
