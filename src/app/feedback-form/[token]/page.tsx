import { getFeedbackCampaignByInviteLink } from '@/lib/actions/feedback-campaign'
import { FeedbackSubmissionForm } from '@/components/feedback/feedback-submission-form'
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
      <div className='flex items-center justify-center py-8 px-4'>
        <div className='w-full'>
          <div className='bg-card/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 p-6 md:p-8 text-center'>
            <h1 className='text-2xl font-bold text-foreground mb-2'>
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
      <div className='flex items-center justify-center py-8 px-4'>
        <div className='w-full'>
          <div className='bg-card/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 p-6 md:p-8 text-center'>
            <h1 className='text-2xl font-bold text-foreground mb-2'>
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
    <div className='flex items-center justify-center py-8 px-4'>
      <div className='w-full md:max-w-[50vw]'>
        <div className='bg-card/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 p-6 md:p-8'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-foreground mb-2'>
              Feedback Request
            </h1>
            <p className='text-muted-foreground'>
              You&apos;ve been invited to provide feedback about{' '}
              <span className='font-semibold text-foreground'>
                {campaign.targetPerson.name}
              </span>
            </p>
          </div>

          <FeedbackSubmissionForm campaign={campaign} />
        </div>
      </div>
    </div>
  )
}
