'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteInitiative } from '@/lib/actions'

interface DeleteInitiativeButtonProps {
  initiativeId: string
}

export function DeleteInitiativeButton({
  initiativeId,
}: DeleteInitiativeButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteInitiative(initiativeId)
    } catch (error) {
      console.error('Error deleting initiative:', error)
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className='flex items-center gap-2'>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant='destructive'
          size='sm'
        >
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </Button>
        <Button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
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
      className='text-red-400 hover:text-red-300 border-red-400 hover:border-red-300'
    >
      <Trash2 className='w-4 h-4 mr-2' />
      Delete
    </Button>
  )
}
