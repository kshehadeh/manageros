'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteTeam } from '@/lib/actions/team'
import { DeleteModal } from '@/components/common/delete-modal'
import { toast } from 'sonner'

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
  const [showDeleteModal, setShowDeleteModal] = useState(false)

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

  const handleDelete = async () => {
    try {
      await deleteTeam(teamId)
      toast.success('Team deleted successfully')
    } catch (error) {
      console.error('Error deleting team:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete team'
      )
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowDeleteModal(true)}
        variant='outline'
        size='sm'
        className='text-destructive border-destructive hover:text-destructive-foreground hover:bg-destructive'
        title={`Delete "${teamName}"`}
      >
        <Trash2 className='w-4 h-4 mr-2' />
        Delete
      </Button>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete "${teamName}"`}
        entityName='team'
      />
    </>
  )
}
