'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Building2, Target, User } from 'lucide-react'
import { deleteMeeting } from '@/lib/actions'
import { ActionDropdown } from '@/components/common/action-dropdown'

interface MeetingActionsDropdownProps {
  meetingId: string
  meeting: {
    team?: { id: string; name: string } | null
    initiative?: { id: string; title: string } | null
    owner?: { id: string; name: string } | null
  }
  size?: 'sm' | 'default'
}

export function MeetingActionsDropdown({
  meetingId,
  meeting,
  size = 'default',
}: MeetingActionsDropdownProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteMeeting(meetingId)
    } catch (error) {
      console.error('Error deleting meeting:', error)
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
            href={`/meetings/${meetingId}/edit`}
            className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
            onClick={close}
          >
            <Edit className='w-4 h-4' />
            Edit Meeting
          </Link>

          {meeting.team && (
            <Link
              href={`/teams/${meeting.team.id}`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <Building2 className='w-4 h-4' />
              View Team
            </Link>
          )}

          {meeting.initiative && (
            <Link
              href={`/initiatives/${meeting.initiative.id}`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <Target className='w-4 h-4' />
              View Initiative
            </Link>
          )}

          {meeting.owner && (
            <Link
              href={`/people/${meeting.owner.id}`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <User className='w-4 h-4' />
              View Owner
            </Link>
          )}

          {showConfirm ? (
            <div className='px-3 py-2 space-y-2'>
              <div className='text-sm font-medium text-destructive mb-2'>
                Are you sure you want to delete this meeting?
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
              Delete Meeting
            </button>
          )}
        </div>
      )}
    </ActionDropdown>
  )
}
