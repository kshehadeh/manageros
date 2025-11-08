import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'

import { FeedbackForm } from '@/components/feedback/feedback-form'
import { NewFeedbackBreadcrumbClient } from '@/components/feedback/new-feedback-breadcrumb-client'
import { getCurrentUser } from '@/lib/auth-utils'

interface NewFeedbackPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function NewFeedbackPage({
  params,
}: NewFeedbackPageProps) {
  const user = await getCurrentUser()

  const { id } = await params

  if (!user.organizationId) {
    redirect('/organization/create')
  }

  // Get the person being given feedback
  const person = await prisma.person.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
    },
  })

  if (!person) {
    notFound()
  }

  return (
    <NewFeedbackBreadcrumbClient personName={person.name} personId={person.id}>
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold'>Add New Feedback</h1>
          <p className='text-neutral-400'>
            Share feedback about {person.name}. This feedback will be visible to
            other team members unless marked as private.
          </p>
        </div>

        <div className='card'>
          <FeedbackForm person={person} redirectTo={`/people/${person.id}`} />
        </div>
      </div>
    </NewFeedbackBreadcrumbClient>
  )
}
