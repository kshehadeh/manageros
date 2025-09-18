'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteTeam } from '@/lib/actions'

interface DeleteTeamIconButtonProps {
  teamId: string
  teamName: string
  hasPeople: boolean
  hasInitiatives: boolean
  hasChildren: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
  className?: string
}

export function DeleteTeamIconButton({
  teamId,
  teamName,
  hasPeople,
  hasInitiatives,
  hasChildren,
  size = 'sm',
  variant = 'outline',
  className = '',
}: DeleteTeamIconButtonProps) {
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
        size={size}
        variant='secondary'
        className={`${className} opacity-50 cursor-not-allowed`}
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
          size={size}
          variant='destructive'
          className={className}
        >
          {isDeleting ? 'Deleting...' : 'Confirm'}
        </Button>
        <Button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          size={size}
          variant='outline'
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => setShowConfirm(true)}
      size={size}
      variant={variant}
      className={className}
      title={`Delete "${teamName}"`}
    >
      <Trash2 className='w-4 h-4' />
      <span className='sr-only'>Delete Team</span>
    </Button>
  )
}
