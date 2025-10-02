'use client'

import { type Person } from '@prisma/client'
import { FeedbackCard } from './feedback-card'
import { Button } from '@/components/ui/button'
import { Eye, Plus } from 'lucide-react'
import Link from 'next/link'

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
      <div className='flex items-center justify-between pb-3 border-b border-border'>
        <h3 className='font-semibold text-foreground'>
          Feedback ({feedback.length})
        </h3>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' asChild title='View All Feedback'>
            <Link href={`/feedback?person=${person.id}`}>
              <Eye className='w-4 h-4' />
            </Link>
          </Button>
          <Button variant='outline' size='sm' asChild title='Add New Feedback'>
            <Link href={`/people/${person.id}/feedback/new`}>
              <Plus className='w-4 h-4' />
            </Link>
          </Button>
        </div>
      </div>

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
