/**
 * Factory for creating integration instances
 */

import 'server-only'
import { prisma } from '@/lib/db'
import type {
  BaseIntegration,
  IntegrationType,
  IntegrationScope,
  IntegrationConfig,
} from './base-integration'
import { GoogleCalendarIntegration } from './google-calendar'
import { MicrosoftOutlookIntegration } from './microsoft-outlook'
import { JiraIntegration } from './jira'
import { GithubIntegration } from './github'

/**
 * Get an integration instance by ID
 */
export async function getIntegration(
  integrationId: string
): Promise<BaseIntegration | null> {
  const integration = await prisma.integration.findUnique({
    where: { id: integrationId },
  })

  if (!integration) {
    return null
  }

  return createIntegrationFromRecord(integration)
}

/**
 * Get an integration instance by type and scope
 */
export async function getIntegrationByType(
  organizationId: string | null,
  userId: string | null,
  type: IntegrationType,
  scope: IntegrationScope
): Promise<BaseIntegration | null> {
  const where: {
    integrationType: string
    scope: string
    organizationId?: string
    userId?: string
  } = {
    integrationType: type,
    scope,
  }

  if (scope === 'organization' && organizationId) {
    where.organizationId = organizationId
  } else if (scope === 'user' && userId) {
    where.userId = userId
  } else {
    return null
  }

  const integration = await prisma.integration.findFirst({
    where,
    orderBy: { createdAt: 'desc' },
  })

  if (!integration) {
    return null
  }

  return createIntegrationFromRecord(integration)
}

/**
 * Create an integration instance from a database record
 */
function createIntegrationFromRecord(record: {
  id: string
  integrationType: string
  scope: string
  name: string
  isEnabled: boolean
  encryptedCredentials: unknown
  metadata: unknown
}): BaseIntegration {
  const config: IntegrationConfig = {
    id: record.id,
    type: record.integrationType as IntegrationType,
    scope: record.scope as IntegrationScope,
    name: record.name,
    isEnabled: record.isEnabled,
    encryptedCredentials: record.encryptedCredentials as Record<
      string,
      unknown
    >,
    metadata: record.metadata as Record<string, unknown> | undefined,
  }

  switch (record.integrationType) {
    case 'google_calendar':
      if (record.scope !== 'organization') {
        throw new Error(
          'Google Calendar integration must be organization-level'
        )
      }
      return new GoogleCalendarIntegration(config)

    case 'microsoft_outlook':
      if (record.scope !== 'organization') {
        throw new Error(
          'Microsoft Outlook integration must be organization-level'
        )
      }
      return new MicrosoftOutlookIntegration(config)

    case 'jira':
      // Jira can be either organization or user level
      return new JiraIntegration(config)

    case 'github':
      // GitHub can be either organization or user level
      return new GithubIntegration(config)

    default:
      throw new Error(`Unknown integration type: ${record.integrationType}`)
  }
}

/**
 * Get all integrations for an organization
 */
export async function getOrganizationIntegrations(
  organizationId: string
): Promise<BaseIntegration[]> {
  const integrations = await prisma.integration.findMany({
    where: {
      organizationId,
      scope: 'organization',
      isEnabled: true,
    },
  })

  return integrations
    .map(record => {
      try {
        return createIntegrationFromRecord(record)
      } catch (error) {
        console.error(`Failed to create integration ${record.id}:`, error)
        return null
      }
    })
    .filter(
      (integration): integration is BaseIntegration => integration !== null
    )
}

/**
 * Get all integrations for a user
 */
export async function getUserIntegrations(
  userId: string
): Promise<BaseIntegration[]> {
  const integrations = await prisma.integration.findMany({
    where: {
      userId,
      scope: 'user',
      isEnabled: true,
    },
  })

  return integrations
    .map(record => {
      try {
        return createIntegrationFromRecord(record)
      } catch (error) {
        console.error(`Failed to create integration ${record.id}:`, error)
        return null
      }
    })
    .filter(
      (integration): integration is BaseIntegration => integration !== null
    )
}
