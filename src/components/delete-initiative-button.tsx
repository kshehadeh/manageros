'use client'

import { useState } from 'react'
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
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className='btn bg-red-600 hover:bg-red-700 text-sm disabled:opacity-50'
        >
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className='btn bg-neutral-600 hover:bg-neutral-700 text-sm'
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className='btn bg-red-600 hover:bg-red-700 text-sm'
    >
      Delete
    </button>
  )
}
