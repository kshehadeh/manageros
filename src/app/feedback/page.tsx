import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllFeedback, getPeopleForFeedbackFilters } from '@/lib/actions'
import FeedbackViewClient from '@/components/feedback/feedback-view-client'
import { prisma } from '@/lib/db'

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

  // Get the person name if aboutPersonId is provided
  const aboutPerson = params.aboutPersonId
    ? await prisma.person.findFirst({
        where: {
          id: params.aboutPersonId,
          organizationId: session.user.organizationId,
        },
        select: {
          id: true,
          name: true,
        },
      })
    : null

  // If aboutPersonId was provided but person not found, show generic title
  const personName = aboutPerson?.name || 'Unknown Person'

  const [feedback, people, currentPerson] = await Promise.all([
    getAllFeedback(cleanFilters),
    getPeopleForFeedbackFilters(),
    prisma.person.findFirst({
      where: {
        user: {
          id: session.user.id,
        },
      },
    }),
  ])

  return (
    <div className='page-container'>
      <div className='page-header'>
        <h1 className='page-title'>
          {params.aboutPersonId
            ? `Feedback Involving ${personName}`
            : 'Feedback'}
        </h1>
        <p className='page-subtitle'>
          {params.aboutPersonId
            ? `View feedback about ${personName}. You can see all public feedback and any private feedback you've written.`
            : "View and filter feedback across your organization. You can see all public feedback and any private feedback you've written."}
        </p>
      </div>

      <FeedbackViewClient
        initialFeedback={feedback}
        people={people}
        currentFilters={cleanFilters}
        currentUserId={currentPerson?.id}
      />
    </div>
  )
}
