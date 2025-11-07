'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { deleteOneOnOne } from '@/lib/actions/oneonone'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { DeleteModal } from '@/components/common/delete-modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface OneOnOneActionsDropdownProps {
  oneOnOneId: string
  size?: 'sm' | 'default'
}

export function OneOnOneActionsDropdown({
  oneOnOneId,
  size = 'default',
}: OneOnOneActionsDropdownProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteOneOnOne(oneOnOneId)
      toast.success('1:1 meeting deleted successfully')
      router.push('/oneonones')
    } catch (error) {
      console.error('Error deleting 1:1 meeting:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete 1:1 meeting'
      )
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <>
      <ActionDropdown size={size}>
        {({ close }) => (
          <div className='py-1'>
            <Link
              href={`/oneonones/${oneOnOneId}/edit`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <Edit className='w-4 h-4' />
              Edit 1:1 Meeting
            </Link>

            <div className='border-t border-border my-1' />

            <button
              className='flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-left'
              onClick={event => {
                event.stopPropagation()
                close()
                setShowDeleteModal(true)
              }}
            >
              <Trash2 className='w-4 h-4' />
              Delete 1:1 Meeting
            </button>
          </div>
        )}
      </ActionDropdown>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Delete 1:1 Meeting'
        entityName='1:1 meeting'
        isLoading={isDeleting}
      />
    </>
  )
}
