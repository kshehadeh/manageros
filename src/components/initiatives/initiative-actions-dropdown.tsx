'use client'

import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { deleteInitiative } from '@/lib/actions'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { ConfirmAction } from '@/components/common/confirm-action'
import { toast } from 'sonner'

interface InitiativeActionsDropdownProps {
  initiativeId: string
  size?: 'sm' | 'default'
}

export function InitiativeActionsDropdown({
  initiativeId,
  size = 'default',
}: InitiativeActionsDropdownProps) {
  const handleDelete = async () => {
    try {
      await deleteInitiative(initiativeId)
      toast.success('Initiative deleted successfully')
    } catch (error) {
      console.error('Error deleting initiative:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete initiative'
      )
    }
  }

  return (
    <ActionDropdown size={size}>
      {({ close }) => (
        <div className='py-1'>
          <Link
            href={`/initiatives/${initiativeId}/edit`}
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
            onClick={close}
          >
            <Edit className='w-4 h-4' />
            Edit Initiative
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
                Delete Initiative
              </button>
            )}
            confirmMessage='Are you sure you want to delete this initiative?'
            confirmDescription='This action cannot be undone.'
          />
        </div>
      )}
    </ActionDropdown>
  )
}
