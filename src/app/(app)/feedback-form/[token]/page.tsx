import { getFeedbackCampaignByInviteLink } from '@/lib/actions/feedback-campaign'
import { FeedbackSubmissionForm } from '@/components/feedback/feedback-submission-form'
import { Suspense } from 'react'

interface FeedbackFormPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function FeedbackFormPage({
  params,
}: FeedbackFormPageProps) {
  const { token } = await params

  try {
    const campaign = await getFeedbackCampaignByInviteLink(token)

    return (
      <div className='min-h-screen py-8'>
        <div className='max-w-[50vw] mx-auto px-4'>
          <div className='bg-card rounded-lg shadow-sm border p-8'>
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

            <Suspense>
              <FeedbackSubmissionForm campaign={campaign} />
            </Suspense>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred'

    return (
      <div className='min-h-screen py-8'>
        <div className='max-w-[50vw] mx-auto px-4'>
          <div className='bg-card rounded-lg shadow-sm border p-8'>
            <div className='text-center'>
              <h1 className='text-3xl font-bold text-destructive mb-4'>
                Invalid Feedback Request
              </h1>
              <p className='text-muted-foreground text-lg'>{errorMessage}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
