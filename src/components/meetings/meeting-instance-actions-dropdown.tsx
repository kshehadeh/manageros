'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { deleteMeetingInstance } from '@/lib/actions/meeting-instance'
import { toast } from 'sonner'
import { ActionDropdown } from '@/components/common/action-dropdown'

interface MeetingInstanceActionsDropdownProps {
  meetingId: string
  instanceId: string
  size?: 'sm' | 'default'
}

export function MeetingInstanceActionsDropdown({
  meetingId,
  instanceId,
  size = 'default',
}: MeetingInstanceActionsDropdownProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteMeetingInstance(instanceId)
      toast.success('Meeting instance deleted successfully')
      window.location.href = `/meetings/${meetingId}`
    } catch (error) {
      console.error('Error deleting meeting instance:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete meeting instance',
      )
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
            href={`/meetings/${meetingId}/instances/${instanceId}/edit`}
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
            onClick={close}
          >
            <Edit className='w-4 h-4' />
            Edit Instance
          </Link>

          {showConfirm ? (
            <div className='px-3 py-2 space-y-2'>
              <div className='text-sm font-medium text-destructive mb-2'>
                Are you sure you want to delete this meeting instance?
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
              Delete Instance
            </button>
          )}
        </div>
      )}
    </ActionDropdown>
  )
}
