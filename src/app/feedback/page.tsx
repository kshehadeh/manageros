import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllFeedback, getPeopleForFeedbackFilters } from '@/lib/actions'
import FeedbackViewClient from '@/components/feedback-view-client'

interface FeedbackPageProps {
  searchParams: Promise<{
    fromPersonId?: string
    aboutPersonId?: string
    kind?: string
    isPrivate?: string
    startDate?: string
    endDate?: string
  }>
}

export default async function FeedbackPage({
  searchParams,
}: FeedbackPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const params = await searchParams

  // Parse filters from search params
  const filters = {
    fromPersonId: params.fromPersonId,
    aboutPersonId: params.aboutPersonId,
    kind: params.kind,
    isPrivate:
      params.isPrivate === 'true'
        ? true
        : params.isPrivate === 'false'
          ? false
          : undefined,
    startDate: params.startDate,
    endDate: params.endDate,
  }

  // Remove undefined values
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined)
  )

  const [feedback, people] = await Promise.all([
    getAllFeedback(cleanFilters),
    getPeopleForFeedbackFilters(),
  ])

  return (
    <div className='min-h-screen py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-neutral-100'>Feedback</h1>
          <p className='mt-2 text-neutral-400'>
            View and filter feedback across your organization. You can see all
            public feedback and any private feedback you&apos;ve written.
          </p>
        </div>

        <FeedbackViewClient
          initialFeedback={feedback}
          people={people}
          currentFilters={cleanFilters}
        />
      </div>
    </div>
  )
}
