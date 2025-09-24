'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Building2,
  Target,
  User,
} from 'lucide-react'
import { deleteMeeting } from '@/lib/actions'

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
  const [openDropdown, setOpenDropdown] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown(!openDropdown)
  }

  const closeDropdown = () => {
    setOpenDropdown(false)
    setShowConfirm(false)
  }

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false)
        setShowConfirm(false)
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  return (
    <div className='relative' ref={dropdownRef}>
      <Button
        variant='ghost'
        size={size}
        className={`${size === 'sm' ? 'h-8 w-8 p-0' : 'h-8 w-8 p-0'}`}
        onClick={handleDropdownClick}
      >
        <MoreHorizontal className='h-4 w-4' />
      </Button>

      {openDropdown && (
        <div
          className='absolute top-full right-0 mt-2 bg-popover text-popover-foreground border rounded-md shadow-lg z-10 min-w-48'
          onClick={e => e.stopPropagation()}
        >
          <div className='py-1'>
            {/* Edit Meeting */}
            <Link
              href={`/meetings/${meetingId}/edit`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={closeDropdown}
            >
              <Edit className='w-4 h-4' />
              Edit Meeting
            </Link>

            {/* View Team */}
            {meeting.team && (
              <Link
                href={`/teams/${meeting.team.id}`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={closeDropdown}
              >
                <Building2 className='w-4 h-4' />
                View Team
              </Link>
            )}

            {/* View Initiative */}
            {meeting.initiative && (
              <Link
                href={`/initiatives/${meeting.initiative.id}`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={closeDropdown}
              >
                <Target className='w-4 h-4' />
                View Initiative
              </Link>
            )}

            {/* View Owner */}
            {meeting.owner && (
              <Link
                href={`/people/${meeting.owner.id}`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={closeDropdown}
              >
                <User className='w-4 h-4' />
                View Owner
              </Link>
            )}

            {/* Delete Meeting */}
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
              <div
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer'
                onClick={() => setShowConfirm(true)}
              >
                <Trash2 className='w-4 h-4' />
                Delete Meeting
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
