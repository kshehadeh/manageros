import { prisma } from '@/lib/db'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { EditFeedbackBreadcrumbClient } from '@/components/feedback/edit-feedback-breadcrumb-client'
import { notFound } from 'next/navigation'

import { redirect } from 'next/navigation'
import { PageSection } from '@/components/ui/page-section'
import { getCurrentUser } from '@/lib/auth-utils'

interface FeedbackEditPageProps {
  params: Promise<{
    id: string
    feedbackId: string
  }>
}

export default async function FeedbackEditPage({
  params,
}: FeedbackEditPageProps) {
  const user = await getCurrentUser()

  const { id, feedbackId } = await params

  if (!user.managerOSOrganizationId) {
    redirect('/organization/create')
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: user.managerOSUserId || '',
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
      organizationId: user.managerOSOrganizationId,
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
