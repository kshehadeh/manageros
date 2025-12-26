'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SimpleInitiativeList } from '@/components/initiatives/initiative-list'
import type { Initiative } from '@/components/initiatives/initiative-list'

interface InitiativesListModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  initiatives: Initiative[]
  emptyStateText?: string
}

/**
 * Modal component for displaying a list of initiatives
 */
export function InitiativesListModal({
  isOpen,
  onClose,
  title,
  initiatives,
  emptyStateText = 'No initiatives found.',
}: InitiativesListModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size='md'>
        <DialogHeader>
          <DialogTitle className='text-lg font-bold font-mono'>
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className='mt-4 max-h-[60vh] overflow-y-auto'>
          <SimpleInitiativeList
            initiatives={initiatives}
            variant='compact'
            emptyStateText={emptyStateText}
            interactive={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
