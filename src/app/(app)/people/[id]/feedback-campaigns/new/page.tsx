import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FeedbackCampaignForm } from '@/components/feedback/feedback-campaign-form'
import { NewFeedbackCampaignBreadcrumbClient } from '@/components/feedback/new-feedback-campaign-breadcrumb-client'
import { checkIfManagerOrSelf } from '@/lib/utils/people-utils'

interface NewFeedbackCampaignPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function NewFeedbackCampaignPage({
  params,
}: NewFeedbackCampaignPageProps) {
  const session = await getServerSession(authOptions)

  const { id } = await params

  if (!session?.user.organizationId) {
    redirect('/organization/create')
  }

  // Get the person
  const person = await prisma.person.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  })

  if (!person) {
    notFound()
  }

  // Get the current user's person ID from session
  if (!session?.user.personId) {
    redirect('/people')
  }

  // Fetch the full person record
  const currentPerson = await prisma.person.findUnique({
    where: {
      id: session.user.personId,
    },
  })

  if (!currentPerson) {
    redirect('/people')
  }

  // Check if the current user is a manager (direct or indirect) of the target person
  const isManager = await checkIfManagerOrSelf(currentPerson.id, person.id)

  if (!isManager) {
    redirect('/people')
  }

  return (
    <NewFeedbackCampaignBreadcrumbClient
      personName={person.name}
      personId={person.id}
    >
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold'>Create Feedback Campaign</h1>
          <p className='text-neutral-400'>
            Create a feedback campaign for {person.name}. External stakeholders
            will be invited to provide feedback.
          </p>
        </div>

        <FeedbackCampaignForm
          person={person}
          redirectTo={`/people/${person.id}/feedback-campaigns`}
        />
      </div>
    </NewFeedbackCampaignBreadcrumbClient>
  )
}
