'use client'

import { useState } from 'react'
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
        <span className='text-sm text-neutral-400'>Are you sure?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className='btn bg-red-600 hover:bg-red-700 text-sm disabled:opacity-50'
        >
          {isDeleting ? 'Deleting...' : 'Yes, Delete'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className='btn bg-neutral-700 hover:bg-neutral-600 text-sm'
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
