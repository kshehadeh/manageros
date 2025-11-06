import { prisma } from '@/lib/db'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { EditFeedbackBreadcrumbClient } from '@/components/feedback/edit-feedback-breadcrumb-client'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageSection } from '@/components/ui/page-section'

interface FeedbackEditPageProps {
  params: Promise<{
    id: string
    feedbackId: string
  }>
}

export default async function FeedbackEditPage({
  params,
}: FeedbackEditPageProps) {
  const session = await getServerSession(authOptions)

  const { id, feedbackId } = await params

  if (!session?.user.organizationId) {
    redirect('/organization/create')
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: session.user.id,
      },
    },
  })

  if (!currentPerson) {
    redirect('/people')
  }

  // Get the person being given feedback
  const person = await prisma.person.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  })

  if (!person) {
    notFound()
  }

  // Get the feedback to edit
  const feedback = await prisma.feedback.findFirst({
    where: {
      id: feedbackId,
      aboutId: id,
      fromId: currentPerson.id, // Only allow editing own feedback
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
  })

  if (!feedback) {
    notFound()
  }

  return (
    <EditFeedbackBreadcrumbClient
      personName={person.name}
      personId={person.id}
      feedbackId={feedback.id}
    >
      <div className='page-container'>
        <PageSection>
          <FeedbackForm
            person={person}
            feedback={{
              id: feedback.id,
              kind: feedback.kind as 'praise' | 'concern' | 'note',
              isPrivate: feedback.isPrivate,
              body: feedback.body,
            }}
            redirectTo={`/people/${id}`}
            header={{
              title: 'Edit Feedback',
              subtitle: `Editing feedback for ${person.name}`,
            }}
          />
        </PageSection>
      </div>
    </EditFeedbackBreadcrumbClient>
  )
}
