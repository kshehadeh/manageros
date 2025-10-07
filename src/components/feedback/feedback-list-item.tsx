'use client'

import { Trash2, Eye, MoreHorizontal, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { getKindLabel } from '@/lib/utils/feedback'

type FeedbackWithRelations = {
  id: string
  kind: string
  isPrivate: boolean
  body: string
  createdAt: Date | string
  about: {
    id: string
    name: string
  }
  from: {
    id: string
    name: string
  }
  fromId?: string // For compatibility with feedback-view-client
}

interface FeedbackListItemProps {
  feedback: FeedbackWithRelations
  currentUserId?: string
  onDelete?: (_id: string) => void
  isDeleting?: boolean
  showAboutPerson?: boolean // Whether to show "about" person info
  variant?: 'default' | 'compact' // Layout variant
}

export function FeedbackListItem({
  feedback,
  currentUserId,
  onDelete,
  isDeleting = false,
  showAboutPerson = false,
  variant = 'default',
}: FeedbackListItemProps) {
  const [openDropdown, setOpenDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return variant === 'compact'
      ? dateObj.toLocaleDateString()
      : dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
  }

  const canDelete =
    feedback.fromId === currentUserId || feedback.from.id === currentUserId

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown(!openDropdown)
  }

  const closeDropdown = () => {
    setOpenDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false)
      }
    }

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdown])

  return (
    <div className='border border-border rounded-xl p-4 bg-card'>
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>
            {getKindLabel(feedback.kind)}
          </span>
          {feedback.isPrivate && <Badge variant='neutral'>Private</Badge>}
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>
            {formatDate(feedback.createdAt)}
          </span>
          <div className='relative' ref={dropdownRef}>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0'
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
                  <Link
                    href={`/feedback/${feedback.id}`}
                    className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                    onClick={closeDropdown}
                  >
                    <Eye className='w-4 h-4' />
                    View
                  </Link>
                  {canDelete && (
                    <>
                      <Link
                        href={`/people/${feedback.about.id}/feedback/${feedback.id}/edit`}
                        className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                        onClick={closeDropdown}
                      >
                        <Edit className='w-4 h-4' />
                        Edit
                      </Link>
                      <button
                        className='w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-left'
                        onClick={() => {
                          onDelete?.(feedback.id)
                          closeDropdown()
                        }}
                        disabled={isDeleting}
                      >
                        <Trash2 className='w-4 h-4' />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAboutPerson ? (
        <div className='text-sm text-muted-foreground mb-2'>
          <span className='text-foreground'>{feedback.from.name}</span> wrote
          about{' '}
          <Link
            href={`/people/${feedback.about.id}`}
            className='text-primary hover:text-primary/90 transition-colors'
          >
            {feedback.about.name}
          </Link>
        </div>
      ) : (
        <div className='text-sm text-muted-foreground mb-2'>
          From:{' '}
          <span className='font-medium text-foreground'>
            {feedback.from.name}
          </span>
        </div>
      )}

      <ReadonlyNotesField
        content={feedback.body}
        variant={variant === 'compact' ? 'compact' : 'default'}
        emptyStateText='No feedback content available'
      />
    </div>
  )
}
