'use client'

import { type Person } from '@prisma/client'
import { FeedbackCard } from './feedback-card'

type FeedbackWithRelations = {
  id: string
  kind: string
  isPrivate: boolean
  body: string
  createdAt: Date
  about: {
    id: string
    name: string
  }
  from: {
    id: string
    name: string
  }
}

interface FeedbackListProps {
  person: Person
  feedback: FeedbackWithRelations[]
  currentUserId?: string
  onRefresh?: () => void
}

export function FeedbackList({
  person,
  feedback,
  currentUserId,
  onRefresh,
}: FeedbackListProps) {
  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-4'>
        {feedback.slice(0, 1).map(item => (
          <FeedbackCard
            key={item.id}
            feedback={item}
            currentUserId={currentUserId}
            onRefresh={onRefresh}
          />
        ))}

        {feedback.length === 0 && (
          <div className='w-full text-muted-foreground text-sm text-center py-8'>
            No feedback yet. Be the first to share feedback about {person.name}.
          </div>
        )}
      </div>
    </div>
  )
}
