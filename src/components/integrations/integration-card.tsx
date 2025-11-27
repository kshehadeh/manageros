/**
 * Integration card component
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, TestTube, Trash2, Settings } from 'lucide-react'
import {
  testOrganizationIntegration,
  testUserIntegration,
} from '@/lib/actions/integrations'
import { IntegrationFormDialog } from './integration-form-dialog'
import { DeleteIntegrationDialog } from './delete-integration-dialog'
import type {
  IntegrationType,
  IntegrationScope,
} from '@/lib/integrations/base-integration'
import { integrationTypeLabels } from '@/lib/integrations/constants'
import { toast } from 'sonner'

interface Integration {
  id: string
  type: IntegrationType
  name: string
  isEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

interface IntegrationCardProps {
  integration: Integration
  scope: IntegrationScope
  onUpdate: () => void
}

export function IntegrationCard({
  integration,
  scope,
  onUpdate,
}: IntegrationCardProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleTest = async () => {
    setIsTesting(true)
    try {
      const result =
        scope === 'organization'
          ? await testOrganizationIntegration(integration.id)
          : await testUserIntegration(integration.id)

      if (result.success) {
        toast.success('Connection test successful')
      } else {
        toast.error(
          result.error ||
            'Connection test failed. Please check your credentials.'
        )
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to test connection'
      )
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className='border rounded-lg p-4 space-y-3'>
      <div className='flex items-start justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <h4 className='font-medium'>{integration.name}</h4>
            <Badge variant='secondary'>
              {integrationTypeLabels[integration.type]}
            </Badge>
            {!integration.isEnabled && (
              <Badge variant='outline'>Disabled</Badge>
            )}
          </div>
          <p className='text-sm text-muted-foreground'>
            Created {new Date(integration.createdAt).toLocaleDateString()}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <MoreVertical className='w-4 h-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={handleTest} disabled={isTesting}>
              <TestTube className='w-4 h-4 mr-2' />
              {isTesting ? 'Testing...' : 'Test Connection'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsFormOpen(true)}>
              <Settings className='w-4 h-4 mr-2' />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsDeleteOpen(true)}
              className='text-destructive'
            >
              <Trash2 className='w-4 h-4 mr-2' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <IntegrationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        scope={scope}
        availableTypes={[integration.type]}
        integration={integration}
        onSuccess={onUpdate}
      />

      <DeleteIntegrationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        integrationId={integration.id}
        integrationName={integration.name}
        scope={scope}
        onSuccess={onUpdate}
      />
    </div>
  )
}
