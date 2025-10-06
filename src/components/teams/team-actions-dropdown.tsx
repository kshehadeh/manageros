'use client'

import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { deleteTeam } from '@/lib/actions/team'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { ConfirmAction } from '@/components/common/confirm-action'
import { toast } from 'sonner'

interface TeamActionsDropdownProps {
  teamId: string
  size?: 'sm' | 'default'
}

export function TeamActionsDropdown({
  teamId,
  size = 'default',
}: TeamActionsDropdownProps) {
  const handleDelete = async () => {
    try {
      await deleteTeam(teamId)
      toast.success('Team deleted successfully')
      window.location.href = '/teams'
    } catch (error) {
      console.error('Error deleting team:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete team'
      )
    }
  }

  return (
    <ActionDropdown size={size}>
      {({ close }) => (
        <div className='py-1'>
          <Link
            href={`/teams/${teamId}/edit`}
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
            onClick={close}
          >
            <Edit className='w-4 h-4' />
            Edit Team
          </Link>

          <div className='border-t border-border my-1' />

          <ConfirmAction
            onConfirm={handleDelete}
            renderTrigger={({ open }) => (
              <button
                className='flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-left'
                onClick={open}
              >
                <Trash2 className='w-4 h-4' />
                Delete Team
              </button>
            )}
            confirmMessage='Are you sure you want to delete this team?'
            confirmDescription='This action cannot be undone.'
          />
        </div>
      )}
    </ActionDropdown>
  )
}
