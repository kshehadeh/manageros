import { prisma } from '@/lib/db'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

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

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id, feedbackId } = await params

  if (!session.user.organizationId) {
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
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold'>Edit Feedback</h2>
          <div className='text-sm text-neutral-400'>
            Editing feedback for {person.name}
          </div>
        </div>
      </div>

      <div className='card'>
        <FeedbackForm
          person={person}
          feedback={{
            id: feedback.id,
            kind: feedback.kind as 'praise' | 'concern' | 'note',
            isPrivate: feedback.isPrivate,
            body: feedback.body,
          }}
          redirectTo={`/people/${id}`}
        />
      </div>
    </div>
  )
}
