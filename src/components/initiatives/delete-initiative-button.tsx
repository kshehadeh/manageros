'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteInitiative } from '@/lib/actions/initiative'
import { DeleteModal } from '@/components/common/delete-modal'
import { toast } from 'sonner'

interface DeleteInitiativeButtonProps {
  initiativeId: string
}

export function DeleteInitiativeButton({
  initiativeId,
}: DeleteInitiativeButtonProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteInitiative(initiativeId)
      toast.success('Initiative deleted successfully')
    } catch (error) {
      console.error('Error deleting initiative:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete initiative'
      )
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowDeleteModal(true)}
        variant='outline'
        size='icon'
      >
        <Trash2 className='w-4 h-4' />
        <span className='sr-only'>Delete Initiative</span>
      </Button>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Delete Initiative'
        entityName='initiative'
      />
    </>
  )
}
