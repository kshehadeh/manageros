'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteSynopsis } from '@/lib/actions/synopsis'
import { DeleteModal } from '@/components/common/delete-modal'
import { toast } from 'sonner'

interface DeleteSynopsisButtonProps {
  synopsisId: string
  onSuccess?: () => void
}

export function DeleteSynopsisButton({
  synopsisId,
  onSuccess,
}: DeleteSynopsisButtonProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteSynopsis(synopsisId)
      toast.success('Synopsis deleted successfully')
      onSuccess?.()
    } catch (error) {
      console.error('Error deleting synopsis:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete synopsis'
      )
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowDeleteModal(true)}
        variant='outline'
        size='icon'
        className='text-destructive border-destructive hover:text-destructive-foreground hover:bg-destructive'
      >
        <Trash2 className='w-4 h-4' />
        <span className='sr-only'>Delete Synopsis</span>
      </Button>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Delete Synopsis'
        entityName='synopsis'
      />
    </>
  )
}
