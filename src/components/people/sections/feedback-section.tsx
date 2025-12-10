import {
  SimpleFeedbackList,
  type Feedback,
} from '@/components/feedback/feedback-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { MessageCircle } from 'lucide-react'
import { getFeedbackForPerson } from '@/lib/actions/feedback'

interface FeedbackSectionProps {
  personId: string
  organizationId: string
}

export async function FeedbackSection({
  personId,
  organizationId,
}: FeedbackSectionProps) {
  if (!organizationId) {
    return null
  }

  // Get feedback for this person (respects privacy rules)
  let feedback: Feedback[] = []
  try {
    const feedbackData = await getFeedbackForPerson(personId)
    feedback = feedbackData.map(fb => ({
      id: fb.id,
      kind: fb.kind,
      isPrivate: fb.isPrivate,
      body: fb.body,
      createdAt: fb.createdAt,
      about: fb.about,
      from: fb.from,
      fromId: (fb as { fromId?: string }).fromId,
    }))
    // Limit to 10 most recent feedback items
    feedback = feedback.slice(0, 10)
  } catch (error) {
    console.error('Error fetching feedback:', error)
    // Continue without feedback
  }

  // Only show if person has feedback
  if (feedback.length === 0) {
    return null
  }

  return (
    <PageSection
      className='flex-1 min-w-[300px]'
      header={<SectionHeader icon={MessageCircle} title='Recent Feedback' />}
    >
      <SimpleFeedbackList
        feedback={feedback}
        emptyStateText='No feedback found.'
        maxTextLength={150}
      />
    </PageSection>
  )
}
