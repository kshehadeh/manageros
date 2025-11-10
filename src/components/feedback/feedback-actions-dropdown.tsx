'use client'

import { Link } from '@/components/ui/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { DeleteModal } from '@/components/common/delete-modal'
import { deleteFeedback } from '@/lib/actions/feedback'
import { toast } from 'sonner'
import { Edit, Trash2 } from 'lucide-react'

interface FeedbackActionsDropdownProps {
  feedbackId: string
  aboutPersonId: string
}

export function FeedbackActionsDropdown({
  feedbackId,
  aboutPersonId,
}: FeedbackActionsDropdownProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteFeedback(feedbackId)
      toast.success('Feedback deleted successfully')
      router.push(`/people/${aboutPersonId}`)
    } catch (error) {
      console.error('Error deleting feedback:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete feedback'
      )
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <>
      <ActionDropdown>
        {({ close }) => (
          <div className='py-1'>
            <Link
              href={`/people/${aboutPersonId}/feedback/${feedbackId}/edit`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <Edit className='w-4 h-4' />
              Edit
            </Link>

            <button
              className='flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-left'
              onClick={() => {
                setShowDeleteModal(true)
                close()
              }}
            >
              <Trash2 className='w-4 h-4' />
              Delete
            </button>
          </div>
        )}
      </ActionDropdown>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Delete Feedback'
        entityName='feedback'
        description='Are you sure you want to delete this feedback? This action cannot be undone.'
        isLoading={isDeleting}
      />
    </>
  )
}
