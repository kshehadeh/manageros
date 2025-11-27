/**
 * Server component for entity integration links
 */

import { getEntityIntegrationLinks } from '@/lib/actions/integrations'
import { EntityIntegrationLinksClient } from './entity-integration-links-client'

interface EntityIntegrationLinksServerProps {
  entityType: string
  entityId: string
}

export async function EntityIntegrationLinksServer({
  entityType,
  entityId,
}: EntityIntegrationLinksServerProps) {
  const links = await getEntityIntegrationLinks(entityType, entityId)

  return (
    <EntityIntegrationLinksClient
      entityType={entityType}
      entityId={entityId}
      links={links.map(link => ({
        id: link.id,
        integration: link.integration,
        externalEntityId: link.externalEntityId,
        externalEntityUrl: link.externalEntityUrl,
        metadata: link.metadata as Record<string, unknown> | null,
        createdAt: new Date(link.createdAt),
      }))}
    />
  )
}
