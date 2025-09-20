'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteTeam } from '@/lib/actions'

interface DeleteTeamButtonProps {
  teamId: string
  teamName: string
  hasPeople: boolean
  hasInitiatives: boolean
  hasChildren: boolean
}

export function DeleteTeamButton({
  teamId,
  teamName,
  hasPeople,
  hasInitiatives,
  hasChildren,
}: DeleteTeamButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteTeam(teamId)
    } catch (error) {
      console.error('Error deleting team:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Error deleting team. Please try again.'
      )
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  // Check if team can be deleted
  const canDelete = !hasPeople && !hasInitiatives && !hasChildren

  if (!canDelete) {
    return (
      <Button
        disabled
        variant='secondary'
        size='sm'
        className='opacity-50 cursor-not-allowed'
        title={`Cannot delete "${teamName}" because it has ${[
          hasPeople && 'members',
          hasInitiatives && 'initiatives',
          hasChildren && 'child teams',
        ]
          .filter(Boolean)
          .join(', ')}`}
      >
        <Trash2 className='w-4 h-4' />
        <span className='sr-only'>Delete Team (Disabled)</span>
      </Button>
    )
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
      className='text-destructive border-destructive hover:text-destructive-foreground hover:bg-destructive'
      title={`Delete "${teamName}"`}
    >
      <Trash2 className='w-4 h-4 mr-2' />
      Delete
    </Button>
  )
}
