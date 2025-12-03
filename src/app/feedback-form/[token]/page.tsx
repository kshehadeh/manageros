import { getFeedbackCampaignByInviteLink } from '@/lib/actions/feedback-campaign'
import { FeedbackSubmissionForm } from '@/components/feedback/feedback-submission-form'
import { FeedbackFormLayout } from '@/components/feedback/feedback-form-layout'

interface FeedbackFormPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function FeedbackFormPage({
  params,
}: FeedbackFormPageProps) {
  const { token } = await params

  const campaign = await getFeedbackCampaignByInviteLink(token)

  if (!campaign) {
    return (
      <div className='flex items-center justify-center py-2xl px-xl'>
        <div className='w-full'>
          <div className='bg-card/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 p-2xl md:p-3xl text-center'>
            <h1 className='text-2xl font-bold text-foreground mb-md'>
              Campaign Not Found
            </h1>
            <p className='text-muted-foreground'>
              The Feedback 360 you&apos;re looking for doesn&apos;t exist or has
              been removed.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Check if the campaign is currently active (within date range)
  const now = new Date()
  if (now < campaign.startDate || now > campaign.endDate) {
    return (
      <div className='flex items-center justify-center py-2xl px-xl'>
        <div className='w-full'>
          <div className='bg-card/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 p-2xl md:p-3xl text-center'>
            <h1 className='text-2xl font-bold text-foreground mb-md'>
              Campaign Not Active
            </h1>
            <p className='text-muted-foreground'>
              This Feedback 360 is not currently active. Please check back
              during the collection period.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <FeedbackFormLayout targetPerson={campaign.targetPerson}>
      <FeedbackSubmissionForm campaign={campaign} />
    </FeedbackFormLayout>
  )
}
