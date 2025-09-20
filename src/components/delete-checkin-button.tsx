'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteCheckIn } from '@/lib/actions'

interface DeleteCheckInButtonProps {
  checkInId: string
  onSuccess?: () => void
}

export function DeleteCheckInButton({
  checkInId,
  onSuccess,
}: DeleteCheckInButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteCheckIn(checkInId)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to delete check-in:', error)
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground'>Are you sure?</span>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant='destructive'
          size='sm'
        >
          {isDeleting ? 'Deleting...' : 'Yes, Delete'}
        </Button>
        <Button
          onClick={() => setShowConfirm(false)}
          variant='outline'
          size='sm'
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => setShowConfirm(true)}
      variant='outline'
      size='sm'
      className='text-destructive border-destructive hover:text-destructive-foreground hover:bg-destructive'
    >
      <Trash2 className='w-4 h-4 mr-2' />
      Delete
    </Button>
  )
}
