'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { deleteInitiative } from '@/lib/actions/initiative'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { DeleteModal } from '@/components/common/delete-modal'
import { toast } from 'sonner'

export interface InitiativeActionsDropdownProps {
  initiativeId: string
  size?: 'sm' | 'default'
  canEdit?: boolean
  canDelete?: boolean
}

export function InitiativeActionsDropdown({
  initiativeId,
  size = 'default',
  canEdit = false,
  canDelete = false,
}: InitiativeActionsDropdownProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteInitiative(initiativeId)
      toast.success('Initiative deleted successfully')
      router.push('/initiatives')
    } catch (error) {
      console.error('Error deleting initiative:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete initiative'
      )
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // Don't show dropdown if user has no permissions
  if (!canEdit && !canDelete) {
    return null
  }

  return (
    <>
      <ActionDropdown size={size}>
        {({ close }) => (
          <div className='py-1'>
            {canEdit && (
              <Link
                href={`/initiatives/${initiativeId}/edit`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={close}
              >
                <Edit className='w-4 h-4' />
                Edit Initiative
              </Link>
            )}

            {canEdit && canDelete && (
              <div className='border-t border-border my-1' />
            )}

            {canDelete && (
              <button
                className='flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-left'
                onClick={event => {
                  event.stopPropagation()
                  close()
                  setShowDeleteModal(true)
                }}
              >
                <Trash2 className='w-4 h-4' />
                Delete Initiative
              </button>
            )}
          </div>
        )}
      </ActionDropdown>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Delete Initiative'
        entityName='initiative'
        isLoading={isDeleting}
      />
    </>
  )
}
