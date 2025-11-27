/**
 * Server component for integrations section
 */

import { getOrganizationIntegrations } from '@/lib/actions/integrations'
import { IntegrationsSectionClient } from './integrations-section-client'
import type { IntegrationType } from '@/lib/integrations/base-integration'

export async function IntegrationsSectionServer() {
  const integrations = await getOrganizationIntegrations()

  return (
    <IntegrationsSectionClient
      integrations={integrations.map(i => ({
        id: i.id,
        type: i.type as IntegrationType,
        name: i.name,
        isEnabled: i.isEnabled,
        createdAt: new Date(i.createdAt),
        updatedAt: new Date(i.updatedAt),
      }))}
    />
  )
}
