/**
 * Dialog for deleting integrations
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  deleteOrganizationIntegration,
  deleteUserIntegration,
} from '@/lib/actions/integrations'
import type { IntegrationScope } from '@/lib/integrations/base-integration'
import { toast } from 'sonner'

interface DeleteIntegrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integrationId: string
  integrationName: string
  scope: IntegrationScope
  onSuccess: () => void
}

export function DeleteIntegrationDialog({
  open,
  onOpenChange,
  integrationId,
  integrationName,
  scope,
  onSuccess,
}: DeleteIntegrationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (scope === 'organization') {
        await deleteOrganizationIntegration(integrationId)
      } else {
        await deleteUserIntegration(integrationId)
      }
      toast.success('Integration deleted successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete integration'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Integration</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{integrationName}&quot;? This
            action cannot be undone and will remove all associated links.
          </DialogDescription>
        </DialogHeader>

        <div className='flex justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
