/**
 * Client component wrapper for entity integration links
 */

'use client'

import { useRouter } from 'next/navigation'
import { EntityIntegrationLinks } from './entity-integration-links'

interface IntegrationLink {
  id: string
  integration: {
    id: string
    name: string
    integrationType: string
    scope: string
  }
  externalEntityId: string
  externalEntityUrl?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: Date
}

interface EntityIntegrationLinksClientProps {
  entityType: string
  entityId: string
  links: IntegrationLink[]
}

export function EntityIntegrationLinksClient({
  entityType,
  entityId,
  links,
}: EntityIntegrationLinksClientProps) {
  const router = useRouter()

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <EntityIntegrationLinks
      entityType={entityType}
      entityId={entityId}
      links={links}
      onRefresh={handleRefresh}
    />
  )
}
