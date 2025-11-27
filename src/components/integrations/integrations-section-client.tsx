/**
 * Client component wrapper for integrations section with refresh capability
 */

'use client'

import { useRouter } from 'next/navigation'
import { IntegrationList } from './integration-list'
import type { IntegrationType } from '@/lib/integrations/base-integration'

interface Integration {
  id: string
  type: IntegrationType
  name: string
  isEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

interface IntegrationsSectionClientProps {
  integrations: Integration[]
}

export function IntegrationsSectionClient({
  integrations,
}: IntegrationsSectionClientProps) {
  const router = useRouter()

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <IntegrationList
      integrations={integrations}
      scope='organization'
      onRefresh={handleRefresh}
    />
  )
}
