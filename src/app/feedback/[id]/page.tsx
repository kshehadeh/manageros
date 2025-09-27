import { getFeedbackById } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { FeedbackDetailClient } from '@/components/feedback-detail-client'
import { EditIconButton } from '@/components/edit-icon-button'

interface FeedbackDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FeedbackDetailPage({
  params,
}: FeedbackDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

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
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold'>Feedback</h2>
              <p className='text-sm text-neutral-400 mt-1'>
                {feedback.from.name} wrote about {feedback.about.name}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <EditIconButton
                href={`/people/${feedback.about.id}/feedback/${feedback.id}/edit`}
                variant='outline'
                size='default'
              />
            </div>
          </div>

          <div className='grid gap-6 md:grid-cols-2'>
            {/* Feedback Details */}
            <section className='card'>
              <h3 className='font-semibold mb-4'>Feedback Details</h3>
              <div className='space-y-3'>
                <div>
                  <span className='text-sm font-medium'>Type:</span>
                  <div className='text-sm text-neutral-400'>
                    <span
                      className={`badge ${
                        feedback.kind === 'praise'
                          ? 'rag-green'
                          : feedback.kind === 'concern'
                            ? 'rag-red'
                            : 'rag-amber'
                      }`}
                    >
                      {feedback.kind}
                    </span>
                  </div>
                </div>

                <div>
                  <span className='text-sm font-medium'>From:</span>
                  <div className='text-sm text-neutral-400'>
                    <Link
                      href={`/people/${feedback.from.id}`}
                      className='hover:text-blue-400'
                    >
                      {feedback.from.name}
                    </Link>
                  </div>
                </div>

                <div>
                  <span className='text-sm font-medium'>About:</span>
                  <div className='text-sm text-neutral-400'>
                    <Link
                      href={`/people/${feedback.about.id}`}
                      className='hover:text-blue-400'
                    >
                      {feedback.about.name}
                    </Link>
                  </div>
                </div>

                <div>
                  <span className='text-sm font-medium'>Privacy:</span>
                  <div className='text-sm text-neutral-400'>
                    {feedback.isPrivate ? (
                      <span className='badge bg-badge-neutral text-badge-neutral-text'>
                        PRIVATE
                      </span>
                    ) : (
                      <span className='badge rag-green'>PUBLIC</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className='text-sm font-medium'>Created:</span>
                  <div className='text-sm text-neutral-400'>
                    {new Date(feedback.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Feedback Content */}
          <section className='card'>
            <h3 className='font-semibold mb-4'>Feedback Content</h3>
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
          </section>
        </div>
      </FeedbackDetailClient>
    )
  } catch (error) {
    console.error('Error loading feedback:', error)
    notFound()
  }
}
