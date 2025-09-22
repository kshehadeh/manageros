'use client'

import { useState } from 'react'
import { deleteFeedback } from '@/lib/actions'
import { type Person } from '@prisma/client'
import { FeedbackListItem } from './feedback-list-item'

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
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    setDeletingId(id)
    try {
      await deleteFeedback(id)
      onRefresh?.()
    } catch (error) {
      console.error('Failed to delete feedback:', error)
      alert('Failed to delete feedback. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='font-semibold text-foreground'>
          Feedback ({feedback.length})
        </h3>
      </div>

      <div className='space-y-3'>
        {feedback.map(item => (
          <FeedbackListItem
            key={item.id}
            feedback={item}
            currentUserId={currentUserId}
            onDelete={handleDelete}
            isDeleting={deletingId === item.id}
            showAboutPerson={false}
            variant='default'
          />
        ))}

        {feedback.length === 0 && (
          <div className='text-muted-foreground text-sm text-center py-8'>
            No feedback yet. Be the first to share feedback about {person.name}.
          </div>
        )}
      </div>
    </div>
  )
}
