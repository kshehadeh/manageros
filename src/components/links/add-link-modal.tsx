'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LinkForm } from '@/components/entity-links'
import { Plus, Link as LinkIcon } from 'lucide-react'

interface AddLinkModalProps {
  entityType: string
  entityId: string
  onLinkAdded?: () => void
}

export function AddLinkModal({
  entityType,
  entityId,
  onLinkAdded,
}: AddLinkModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSuccess = () => {
    setIsOpen(false)
    if (onLinkAdded) {
      onLinkAdded()
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          <Plus className='w-4 h-4 mr-2' />
          Add Link
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-[50vh]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <LinkIcon className='h-5 w-5' />
            Add Link
          </DialogTitle>
          <DialogDescription>
            Add a link to provide additional context and resources for this{' '}
            {entityType.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>
        <LinkForm
          entityType={entityType}
          entityId={entityId}
          onSuccess={handleSuccess}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
