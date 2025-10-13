'use client'

import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Calendar, User as UserIcon } from 'lucide-react'
import type { FeedbackListItem } from '@/types/api'
import { getKindLabel } from '@/lib/utils/feedback'

interface CreateColumnsProps {
  onButtonClick?: (_e: React.MouseEvent, _feedbackId: string) => void
  onRowClick?: (_feedbackId: string) => void
}

export function createFeedbackColumns({
  onButtonClick,
  onRowClick,
}: CreateColumnsProps): ColumnDef<FeedbackListItem>[] {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getExcerpt = (content: string, maxLength: number = 150) => {
    if (!content) return 'No content available'
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  return [
    {
      id: 'about',
      header: 'About',
      accessorFn: row => row.about.name,
      cell: ({ row }) => {
        const feedback = row.original
        return (
          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-2'>
              <Link
                href={`/people/${feedback.about.id}`}
                className='text-primary hover:text-primary/90 transition-colors'
                onClick={e => e.stopPropagation()}
              >
                {feedback.about.name}
              </Link>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground'>
                {getKindLabel(feedback.kind)}
              </span>
              {feedback.isPrivate && (
                <span className='text-xs text-muted-foreground'>Private</span>
              )}
            </div>
          </div>
        )
      },
      size: 200,
      minSize: 150,
      maxSize: 300,
    },
    {
      id: 'from',
      header: () => (
        <div className='flex items-center gap-2'>
          <UserIcon className='h-4 w-4' />
          Written by
        </div>
      ),
      accessorFn: row => row.from.name,
      cell: ({ row }) => {
        const feedback = row.original
        return (
          <span className='text-muted-foreground'>{feedback.from.name}</span>
        )
      },
      size: 180,
      minSize: 120,
      maxSize: 250,
    },
    {
      id: 'createdAt',
      header: () => (
        <div className='flex items-center gap-2'>
          <Calendar className='h-4 w-4' />
          Date
        </div>
      ),
      accessorFn: row => row.createdAt,
      cell: ({ row }) => {
        const feedback = row.original
        return (
          <span className='text-muted-foreground'>
            {formatDate(feedback.createdAt)}
          </span>
        )
      },
      size: 140,
      minSize: 120,
      maxSize: 180,
    },
    {
      id: 'body',
      header: 'Feedback',
      accessorFn: row => row.body,
      cell: ({ row }) => {
        const feedback = row.original
        return (
          <button
            onClick={() => onRowClick?.(feedback.id)}
            className='text-left text-sm hover:text-primary transition-colors'
          >
            <div className='line-clamp-2'>{getExcerpt(feedback.body, 150)}</div>
          </button>
        )
      },
      size: 400,
      minSize: 200,
      maxSize: 600,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const feedback = row.original
        return (
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
            onClick={e => {
              e.stopPropagation()
              if (onButtonClick) {
                onButtonClick(e, feedback.id)
              }
            }}
          >
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        )
      },
      size: 60,
      minSize: 50,
      maxSize: 100,
    },
  ]
}
