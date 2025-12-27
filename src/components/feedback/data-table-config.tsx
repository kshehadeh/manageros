'use client'

import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Calendar, User as UserIcon } from 'lucide-react'
import type { FeedbackListItem } from '@/types/api'
import { getKindLabel } from '@/lib/utils/feedback'
import { useFeedback } from '@/hooks/use-feedback'
import {
  useFeedbackTableSettings,
  feedbackTableUrlConfig,
} from '@/hooks/use-feedback-table-settings'
import { deleteFeedback } from '@/lib/actions/feedback'
import type { DataTableConfig } from '@/components/common/generic-data-table'
import { formatDistanceToNow } from 'date-fns'

export const feedbackDataTableConfig: DataTableConfig<FeedbackListItem> = {
  // Entity identification
  entityType: 'feedback',
  entityName: 'Feedback',
  entityNamePlural: 'Feedback',

  // Data fetching
  useDataHook: useFeedback,

  // Settings management
  useSettingsHook: useFeedbackTableSettings,

  // URL synchronization
  urlConfig: feedbackTableUrlConfig,

  // Column definitions
  createColumns: ({ onButtonClick, visibleColumns }) => {
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
                  className='text-primary hover:text-highlight/90 transition-colors'
                  onClick={e => e.stopPropagation()}
                >
                  {feedback.about.name}
                </Link>
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-xs text-muted-foreground'>
                  {getKindLabel(feedback.kind)}
                </span>
                <span className='text-xs text-muted-foreground whitespace-nowrap'>
                  {feedback.from.name}
                </span>
                <span className='text-xs text-muted-foreground whitespace-nowrap'>
                  {formatDistanceToNow(feedback.createdAt)}
                </span>
              </div>
            </div>
          )
        },
        size: 200,
        minSize: 150,
        maxSize: 300,
        meta: {
          hidden: visibleColumns?.includes('about') === false,
        },
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
        meta: {
          hidden: true,
        },
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
        size: 120,
        minSize: 100,
        maxSize: 150,
        meta: {
          hidden: true,
        },
      },
      {
        id: 'content',
        header: 'Content',
        accessorFn: row => row.body,
        cell: ({ row }) => {
          const feedback = row.original
          return (
            <div className='max-w-md'>
              <p className='text-sm text-muted-foreground line-clamp-3'>
                {getExcerpt(feedback.body)}
              </p>
            </div>
          )
        },
        size: 300,
        minSize: 200,
        maxSize: 500,
        meta: {
          hidden: true,
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const feedback = row.original
          return (
            <div className='flex items-center justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={e => {
                  e.stopPropagation()
                  onButtonClick(e, feedback.id)
                }}
              >
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </div>
          )
        },
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableSorting: false,
        enableHiding: false,
        meta: {
          hidden: false,
        },
      },
    ]
  },

  // Actions
  deleteAction: deleteFeedback,

  // UI configuration
  searchPlaceholder: 'Search feedback...',
  emptyMessage: 'No feedback found',
  loadingMessage: 'Loading feedback...',

  // Grouping and sorting options
  groupingOptions: [
    { value: 'none', label: 'No grouping' },
    { value: 'about', label: 'Group by person' },
    { value: 'from', label: 'Group by author' },
    { value: 'kind', label: 'Group by kind' },
    { value: 'createdAt', label: 'Group by date' },
  ],
  sortOptions: [
    { value: 'about', label: 'About' },
    { value: 'from', label: 'Author' },
    { value: 'createdAt', label: 'Date' },
  ],
}
