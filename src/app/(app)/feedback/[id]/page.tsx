import { getFeedbackById } from '@/lib/actions/feedback'
import { notFound } from 'next/navigation'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { FeedbackDetailClient } from '@/components/feedback/feedback-detail-client'
import { FeedbackActionsDropdown } from '@/components/feedback/feedback-actions-dropdown'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { MessageCircle, FileText } from 'lucide-react'

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
    if (!feedback) {
      notFound()
    }

    return (
      <FeedbackDetailClient
        feedbackKind={feedback.kind}
        fromName={feedback.from.name}
        aboutName={feedback.about.name}
        feedbackId={feedback.id}
      >
        <PageContainer>
          <PageHeader
            title={`Feedback for ${feedback.about.name} from ${feedback.from.name}`}
            titleIcon={MessageCircle}
            subtitle={`${feedback.kind === 'praise' ? 'Praise' : feedback.kind === 'concern' ? 'Concern' : 'Note'} • ${feedback.isPrivate ? 'Private' : 'Public'} • Created ${new Date(feedback.createdAt).toLocaleDateString()}`}
            actions={
              <FeedbackActionsDropdown
                feedbackId={feedback.id}
                aboutPersonId={feedback.about.id}
              />
            }
          />

          <PageContent>
            <PageMain>
              <PageSection
                header={<SectionHeader icon={FileText} title='Feedback' />}
              >
                <div className='text-sm text-neutral-400'>
                  {feedback.body ? (
                    <ReadonlyNotesField
                      content={feedback.body}
                      variant='default'
                      emptyStateText='No content recorded'
                      truncateMode={true}
                      maxHeight='200px'
                    />
                  ) : (
                    <div className='text-center py-8 text-neutral-500'>
                      No content recorded
                    </div>
                  )}
                </div>
              </PageSection>
            </PageMain>
          </PageContent>
        </PageContainer>
      </FeedbackDetailClient>
    )
  } catch (error) {
    console.error('Error loading feedback:', error)
    notFound()
  }
}
