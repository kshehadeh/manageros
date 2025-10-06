import { prisma } from '@/lib/db'
import { FeedbackList } from '@/components/feedback/feedback-list'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { MessageCircle, Eye, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Person } from '@prisma/client'

interface FeedbackSectionProps {
  personId: string
  person: Person
  currentPersonId?: string
}

export async function FeedbackSection({
  personId,
  person,
  currentPersonId,
}: FeedbackSectionProps) {
  // Get feedback for this person
  const feedback = await prisma.feedback.findMany({
    where: {
      aboutId: personId,
    },
    include: {
      about: {
        select: {
          id: true,
          name: true,
        },
      },
      from: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Filter feedback based on privacy rules
  // Only show feedback that is either:
  // 1. Not private (public feedback)
  // 2. Private feedback written by the current user
  const visibleFeedback = feedback.filter(
    feedback => !feedback.isPrivate || feedback.fromId === currentPersonId
  )

  // Only show if there's feedback or user can add feedback
  if (visibleFeedback.length === 0 && !currentPersonId) {
    return null
  }

  return (
    <div className='flex-1 min-w-[300px] max-w-[500px]'>
      <section id='feedback'>
        <SectionHeader
          icon={MessageCircle}
          title={`Feedback (${visibleFeedback.length})`}
          action={
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                asChild
                title='View All Feedback'
              >
                <Link href={`/feedback?aboutPersonId=${personId}`}>
                  <Eye className='w-4 h-4' />
                </Link>
              </Button>
              <Button
                variant='outline'
                size='sm'
                asChild
                title='Add New Feedback'
              >
                <Link href={`/people/${personId}/feedback/new`}>
                  <Plus className='w-4 h-4' />
                </Link>
              </Button>
            </div>
          }
        />
        <FeedbackList
          person={person}
          feedback={visibleFeedback}
          currentUserId={currentPersonId}
        />
      </section>
    </div>
  )
}
