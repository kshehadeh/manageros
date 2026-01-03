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
