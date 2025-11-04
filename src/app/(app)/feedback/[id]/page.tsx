import { getFeedbackById } from '@/lib/actions/feedback'
import { notFound } from 'next/navigation'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { FeedbackDetailClient } from '@/components/feedback/feedback-detail-client'
import { FeedbackActionsDropdown } from '@/components/feedback/feedback-actions-dropdown'
import { MessageCircle } from 'lucide-react'

interface FeedbackDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FeedbackDetailPage({
  params,
}: FeedbackDetailPageProps) {
  const { id } = await params

  try {
    const feedback = await getFeedbackById(id)

    return (
      <FeedbackDetailClient
        feedbackKind={feedback.kind}
        fromName={feedback.from.name}
        aboutName={feedback.about.name}
        feedbackId={feedback.id}
      >
        <div className='page-container'>
          <div className='page-header'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-2'>
                  <MessageCircle className='h-6 w-6 text-muted-foreground' />
                  <h1 className='page-title'>
                    Feedback for {feedback.about.name} from {feedback.from.name}
                  </h1>
                </div>
                <div className='text-xs text-muted-foreground mt-1'>
                  {feedback.kind === 'praise' && 'Praise'}
                  {feedback.kind === 'concern' && 'Concern'}
                  {feedback.kind === 'note' && 'Note'} •{' '}
                  {feedback.isPrivate ? 'Private' : 'Public'} • Created{' '}
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <FeedbackActionsDropdown
                  feedbackId={feedback.id}
                  aboutPersonId={feedback.about.id}
                />
              </div>
            </div>
          </div>

          {/* Feedback Content */}
          <div className='space-y-6'>
            <div className='flex items-center justify-between border-b border-muted pb-3 mb-3'>
              <h3 className='font-bold'>Feedback</h3>
            </div>
            <div className='text-sm text-neutral-400'>
              {feedback.body ? (
                <ReadonlyNotesField
                  content={feedback.body}
                  variant='default'
                  emptyStateText='No content recorded'
                />
              ) : (
                <div className='text-center py-8 text-neutral-500'>
                  No content recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </FeedbackDetailClient>
    )
  } catch (error) {
    console.error('Error loading feedback:', error)
    notFound()
  }
}
