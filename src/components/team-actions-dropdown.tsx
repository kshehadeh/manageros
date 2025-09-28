'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { deleteTeam } from '@/lib/actions'

interface TeamActionsDropdownProps {
  teamId: string
  size?: 'sm' | 'default'
}

export function TeamActionsDropdown({
  teamId,
  size = 'default',
}: TeamActionsDropdownProps) {
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
      await deleteTeam(teamId)
      // Redirect to teams list after successful deletion
      window.location.href = '/teams'
    } catch (error) {
      console.error('Error deleting team:', error)
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
            {/* Edit Team */}
            <Link
              href={`/teams/${teamId}/edit`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={closeDropdown}
            >
              <Edit className='w-4 h-4' />
              Edit Team
            </Link>

            {/* Delete Team */}
            {showConfirm ? (
              <div className='px-3 py-2 space-y-2'>
                <div className='text-sm font-medium text-destructive mb-2'>
                  Are you sure you want to delete this team?
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
                Delete Team
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
