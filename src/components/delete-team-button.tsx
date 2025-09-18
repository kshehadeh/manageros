'use client'

import { useState } from 'react'
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
      <button
        disabled
        className='btn bg-neutral-600 text-neutral-400 cursor-not-allowed text-sm'
        title={`Cannot delete "${teamName}" because it has ${[
          hasPeople && 'members',
          hasInitiatives && 'initiatives',
          hasChildren && 'child teams',
        ]
          .filter(Boolean)
          .join(', ')}`}
      >
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
          />
        </svg>
      </button>
    )
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
      title={`Delete "${teamName}"`}
    >
      <svg
        className='w-4 h-4'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
        />
      </svg>
    </button>
  )
}
