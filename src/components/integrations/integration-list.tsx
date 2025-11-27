/**
 * List of integrations for organization or user
 */

'use client'

import { useState } from 'react'
import { IntegrationCard } from './integration-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { IntegrationFormDialog } from './integration-form-dialog'
import type {
  IntegrationType,
  IntegrationScope,
} from '@/lib/integrations/base-integration'

interface Integration {
  id: string
  type: IntegrationType
  name: string
  isEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

interface IntegrationListProps {
  integrations: Integration[]
  scope: IntegrationScope
  onRefresh: () => void
}

export function IntegrationList({
  integrations,
  scope,
  onRefresh,
}: IntegrationListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)

  const availableTypes: IntegrationType[] =
    scope === 'organization'
      ? ['google_calendar', 'microsoft_outlook', 'jira', 'github']
      : ['jira', 'github']

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>
            {scope === 'organization' ? 'Organization' : 'Personal'}{' '}
            Integrations
          </h3>
          <p className='text-sm text-muted-foreground'>
            {scope === 'organization'
              ? 'Manage calendar integrations for your organization'
              : 'Manage your personal integrations'}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className='w-4 h-4 mr-2' />
          Add Integration
        </Button>
      </div>

      {integrations.length === 0 ? (
        <div className='text-center py-8 text-muted-foreground'>
          <p>No integrations configured yet.</p>
          <p className='text-sm mt-2'>Add an integration to get started.</p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {integrations.map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              scope={scope}
              onUpdate={onRefresh}
            />
          ))}
        </div>
      )}

      <IntegrationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        scope={scope}
        availableTypes={availableTypes}
        onSuccess={onRefresh}
      />
    </div>
  )
}
