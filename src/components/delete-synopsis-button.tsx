'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteSynopsis } from '@/lib/actions/synopsis'

interface DeleteSynopsisButtonProps {
  synopsisId: string
  onSuccess?: () => void
}

export function DeleteSynopsisButton({
  synopsisId,
  onSuccess,
}: DeleteSynopsisButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteSynopsis(synopsisId)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to delete synopsis:', error)
      alert('Failed to delete synopsis. Please try again.')
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
      size='icon'
      className='text-destructive border-destructive hover:text-destructive-foreground hover:bg-destructive'
    >
      <Trash2 className='w-4 h-4' />
      <span className='sr-only'>Delete Synopsis</span>
    </Button>
  )
}
