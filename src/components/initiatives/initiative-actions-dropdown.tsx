'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteInitiative } from '@/lib/actions'
import { ActionDropdown } from '@/components/common/action-dropdown'

interface InitiativeActionsDropdownProps {
  initiativeId: string
  size?: 'sm' | 'default'
}

export function InitiativeActionsDropdown({
  initiativeId,
  size = 'default',
}: InitiativeActionsDropdownProps) {
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

  return (
    <ActionDropdown
      size={size}
      onOpenChange={open => {
        if (!open) {
          setShowConfirm(false)
        }
      }}
    >
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

          {showConfirm ? (
            <div className='px-3 py-2 space-y-2'>
              <div className='text-sm font-medium text-destructive mb-2'>
                Are you sure you want to delete this initiative?
              </div>
              <div className='flex gap-2'>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  variant='destructive'
                  size='sm'
                  className='flex-1'
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                  onClick={() => setShowConfirm(false)}
                  disabled={isDeleting}
                  variant='outline'
                  size='sm'
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
              onClick={() => setShowConfirm(true)}
            >
              <Trash2 className='w-4 h-4' />
              Delete Initiative
            </button>
          )}
        </div>
      )}
    </ActionDropdown>
  )
}
