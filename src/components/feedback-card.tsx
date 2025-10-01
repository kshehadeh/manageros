'use client'

import { Lock, Calendar, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useState } from 'react'
import { FeedbackDialog } from './feedback-dialog'

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
  fromId?: string
}

interface FeedbackCardProps {
  feedback: FeedbackWithRelations
  currentUserId?: string
  onRefresh?: () => void
}

export function FeedbackCard({
  feedback,
  currentUserId,
  onRefresh,
}: FeedbackCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const getKindVariant = (
    kind: string
  ):
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'neutral' => {
    switch (kind) {
      case 'praise':
        return 'success'
      case 'concern':
        return 'error'
      case 'note':
        return 'info'
      default:
        return 'neutral'
    }
  }

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'praise':
        return 'Praise'
      case 'concern':
        return 'Concern'
      case 'note':
        return 'Note'
      default:
        return 'Note'
    }
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getExcerpt = (content: string, maxLength: number = 120) => {
    if (!content) return 'No content available'
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  const canEdit =
    feedback.fromId === currentUserId || feedback.from.id === currentUserId

  return (
    <>
      <Card
        className='cursor-pointer hover:shadow-md transition-shadow duration-200 w-full min-w-[280px] max-w-[400px]'
        onClick={() => setIsDialogOpen(true)}
      >
        <CardContent className='p-4 flex flex-col h-full'>
          <div className='flex flex-col h-full space-y-3'>
            {/* Header with badges */}
            <div className='flex items-center gap-2 flex-wrap'>
              <Badge variant={getKindVariant(feedback.kind)}>
                {getKindLabel(feedback.kind)}
              </Badge>
              {feedback.isPrivate && (
                <Badge variant='neutral' className='flex items-center gap-1'>
                  <Lock className='w-3 h-3' />
                  Private
                </Badge>
              )}
            </div>

            {/* Author */}
            <div className='flex items-center gap-1 text-sm text-muted-foreground'>
              <User className='w-3 h-3' />
              <span>From {feedback.from.name}</span>
            </div>

            {/* Content excerpt - flex-grow to take available space */}
            <div className='text-sm text-foreground leading-relaxed flex-grow'>
              {getExcerpt(feedback.body)}
            </div>

            {/* Date at bottom */}
            <div className='flex items-center gap-1 text-xs text-muted-foreground mt-auto'>
              <Calendar className='w-3 h-3' />
              {formatDate(feedback.createdAt)}
            </div>
          </div>
        </CardContent>
      </Card>

      <FeedbackDialog
        feedback={feedback}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        canEdit={canEdit}
        onRefresh={onRefresh}
      />
    </>
  )
}
