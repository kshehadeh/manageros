/**
 * Dialog for creating/editing integrations
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  createOrganizationIntegration,
  updateOrganizationIntegration,
  createUserIntegration,
  updateUserIntegration,
} from '@/lib/actions/integrations'
import { IntegrationCredentialsForm } from './integration-credentials-form'
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
}

interface IntegrationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scope: IntegrationScope
  availableTypes: IntegrationType[]
  integration?: Integration
  onSuccess: () => void
}

export function IntegrationFormDialog({
  open,
  onOpenChange,
  scope,
  availableTypes,
  integration,
  onSuccess,
}: IntegrationFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<IntegrationType | ''>('')
  const [isEnabled, setIsEnabled] = useState(true)
  const [credentials, setCredentials] = useState<Record<string, string>>({})

  useEffect(() => {
    if (integration) {
      setName(integration.name)
      setType(integration.type)
      setIsEnabled(integration.isEnabled)
    } else {
      setName('')
      setType('')
      setIsEnabled(true)
      setCredentials({})
    }
  }, [integration, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !type) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      if (integration) {
        // Update existing
        if (scope === 'organization') {
          await updateOrganizationIntegration(integration.id, {
            name,
            isEnabled,
            ...(Object.keys(credentials).length > 0 && { credentials }),
          })
        } else {
          await updateUserIntegration(integration.id, {
            name,
            isEnabled,
            ...(Object.keys(credentials).length > 0 && { credentials }),
          })
        }
        toast.success('Integration updated successfully')
      } else {
        // Create new
        if (scope === 'organization') {
          await createOrganizationIntegration({
            integrationType: type as IntegrationType,
            name,
            credentials,
          })
        } else {
          await createUserIntegration({
            integrationType: type as IntegrationType,
            name,
            credentials,
          })
        }
        toast.success('Integration created successfully')
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save integration'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size='md'>
        <DialogHeader>
          <DialogTitle>
            {integration ? 'Edit Integration' : 'Add Integration'}
          </DialogTitle>
          <DialogDescription>
            {integration
              ? 'Update your integration settings'
              : 'Configure a new integration for your organization'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='My Integration'
              required
            />
          </div>

          {!integration && (
            <div className='space-y-2'>
              <Label htmlFor='type'>Integration Type</Label>
              <Select
                value={type}
                onValueChange={value => setType(value as IntegrationType)}
                required
              >
                <SelectTrigger id='type'>
                  <SelectValue placeholder='Select integration type' />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map(t => (
                    <SelectItem key={t} value={t}>
                      {integrationTypeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {integration && (
            <div className='space-y-2'>
              <Label htmlFor='type'>Integration Type</Label>
              <Input
                id='type'
                value={integrationTypeLabels[integration.type]}
                disabled
              />
            </div>
          )}

          {type && (
            <IntegrationCredentialsForm
              type={type as IntegrationType}
              credentials={credentials}
              onChange={setCredentials}
            />
          )}

          {integration && (
            <div className='flex items-center justify-between'>
              <Label htmlFor='enabled'>Enabled</Label>
              <Switch
                id='enabled'
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>
          )}

          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : integration ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
