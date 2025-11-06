'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { getKindLabel } from '@/lib/utils/feedback'
import { SimpleListContainer } from '@/components/common/simple-list-container'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'

export interface Feedback {
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
  fromId?: string
}

export interface FeedbackListProps {
  feedback: Feedback[]
  emptyStateText?: string
  className?: string
  immutableFilters?: Record<string, unknown>
  maxTextLength?: number // Maximum characters to show before ellipsis
}

export function SimpleFeedbackList({
  feedback,
  emptyStateText = 'No feedback found.',
  className = '',
  immutableFilters,
  maxTextLength = 150,
}: FeedbackListProps) {
  // Filter feedback based on immutable filters
  const filterFeedback = (feedbackToFilter: Feedback[]) => {
    if (!immutableFilters || Object.keys(immutableFilters).length === 0) {
      return feedbackToFilter
    }

    return feedbackToFilter.filter(fb => {
      return Object.entries(immutableFilters).every(([key, value]) => {
        switch (key) {
          case 'aboutId':
            return fb.about.id === value
          case 'fromId':
            return fb.from.id === value
          case 'kind':
            return fb.kind === value
          case 'isPrivate':
            return fb.isPrivate === value
          default:
            return (fb as unknown as Record<string, unknown>)[key] === value
        }
      })
    })
  }

  // Apply filters to feedback
  const visibleFeedback = filterFeedback(feedback)

  // Truncate text with ellipsis
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) {
      return text
    }
    // Find the last space before maxLength to avoid cutting words
    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    return lastSpace > 0
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...'
  }

  const renderFeedbackItem = (fb: Feedback) => {
    const date =
      typeof fb.createdAt === 'string' ? new Date(fb.createdAt) : fb.createdAt
    const truncatedBody = truncateText(fb.body, maxTextLength)

    return (
      <SimpleListItem key={fb.id}>
        <Link
          href={`/feedback/${fb.id}`}
          className='flex items-start gap-3 flex-1 min-w-0'
        >
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='text-xs text-muted-foreground'>
                {getKindLabel(fb.kind)}
              </span>
              {fb.isPrivate && (
                <Badge variant='neutral' className='text-xs'>
                  Private
                </Badge>
              )}
            </div>

            <p className='text-sm text-foreground mb-2 line-clamp-2'>
              {truncatedBody}
            </p>

            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <span>From: {fb.from.name}</span>
              <span>•</span>
              <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
            </div>
          </div>
        </Link>
      </SimpleListItem>
    )
  }

  return (
    <SimpleListContainer className={className}>
      <SimpleListItemsContainer
        isEmpty={visibleFeedback.length === 0}
        emptyStateText={emptyStateText}
      >
        {visibleFeedback.map(renderFeedbackItem)}
      </SimpleListItemsContainer>
    </SimpleListContainer>
  )
}
