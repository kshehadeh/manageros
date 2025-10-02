'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { deleteNotification } from '@/lib/actions/notification'
import { toast } from 'sonner'

interface NotificationActionsDropdownProps {
  notificationId: string
  notificationTitle: string
  size?: 'sm' | 'default'
}

export function NotificationActionsDropdown({
  notificationId,
  notificationTitle,
  size = 'default',
}: NotificationActionsDropdownProps) {
  const [openDropdown, setOpenDropdown] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown(!openDropdown)
  }

  const _closeDropdown = () => {
    setOpenDropdown(false)
    setShowConfirm(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteNotification(notificationId)
      toast.success('Notification deleted successfully')
      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete notification'
      )
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
        <div className='absolute right-0 top-8 z-50 w-48 bg-background border rounded-md shadow-lg'>
          <div className='py-1'>
            {/* Delete Notification */}
            {showConfirm ? (
              <div className='px-3 py-2 space-y-2'>
                <div className='text-sm font-medium text-destructive mb-2'>
                  Are you sure you want to delete this notification?
                </div>
                <div className='text-xs text-muted-foreground mb-2'>
                  &ldquo;{notificationTitle}&rdquo;
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
                Delete Notification
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
