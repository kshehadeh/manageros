/**
 * Base integration interface and types for all integrations
 * Supports both organization-level and user-level integrations
 */

import 'server-only'

export type IntegrationScope = 'organization' | 'user'

export type IntegrationType =
  | 'google_calendar'
  | 'microsoft_outlook'
  | 'jira'
  | 'github'

export interface ExternalEntity {
  id: string
  title?: string
  description?: string
  url?: string
  metadata?: Record<string, unknown>
}

export interface SearchQuery {
  query?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
  metadata?: Record<string, unknown>
}

export interface IntegrationConfig {
  id: string
  type: IntegrationType
  scope: IntegrationScope
  name: string
  isEnabled: boolean
  encryptedCredentials: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * Base interface that all integrations must implement
 */
export interface BaseIntegration {
  /**
   * Get the integration type
   */
  getType(): IntegrationType

  /**
   * Get the integration scope (organization or user)
   */
  getScope(): IntegrationScope

  /**
   * Test the connection to the external service
   */
  testConnection(): Promise<boolean>

  /**
   * Search for entities in the external system
   */
  searchEntities(query: SearchQuery): Promise<ExternalEntity[]>

  /**
   * Get a specific entity by ID from the external system
   */
  getEntityById(id: string): Promise<ExternalEntity | null>

  /**
   * Validate credentials without making a full connection test
   */
  validateCredentials(): Promise<boolean>
}

/**
 * Base class for integrations with common error handling
 */
export abstract class BaseIntegrationImpl implements BaseIntegration {
  protected config: IntegrationConfig

  constructor(config: IntegrationConfig) {
    this.config = config
  }

  abstract getType(): IntegrationType
  abstract getScope(): IntegrationScope
  abstract testConnection(): Promise<boolean>
  abstract searchEntities(query: SearchQuery): Promise<ExternalEntity[]>
  abstract getEntityById(id: string): Promise<ExternalEntity | null>

  async validateCredentials(): Promise<boolean> {
    try {
      return await this.testConnection()
    } catch {
      return false
    }
  }

  /**
   * Retry helper for API calls
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error | null = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        }
      }
    }

    throw lastError || new Error('Unknown error in retry')
  }
}
