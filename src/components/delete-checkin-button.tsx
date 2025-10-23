'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteCheckIn } from '@/lib/actions/checkin'
import { DeleteModal } from '@/components/common/delete-modal'
import { toast } from 'sonner'

interface DeleteCheckInButtonProps {
  checkInId: string
  onSuccess?: () => void
}

export function DeleteCheckInButton({
  checkInId,
  onSuccess,
}: DeleteCheckInButtonProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteCheckIn(checkInId)
      toast.success('Check-in deleted successfully')
      onSuccess?.()
    } catch (error) {
      console.error('Error deleting check-in:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete check-in'
      )
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowDeleteModal(true)}
        variant='destructive'
        size='sm'
      >
        <Trash2 className='w-4 h-4 mr-2' />
        Delete
      </Button>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Delete Check-in'
        entityName='check-in'
      />
    </>
  )
}
