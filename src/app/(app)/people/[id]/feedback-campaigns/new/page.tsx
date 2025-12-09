import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'

import { FeedbackCampaignForm } from '@/components/feedback/feedback-campaign-form'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'
import { checkIfManagerOrSelf } from '@/lib/utils/people-utils'
import { getCurrentUser } from '@/lib/auth-utils'

interface NewFeedbackCampaignPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function NewFeedbackCampaignPage({
  params,
}: NewFeedbackCampaignPageProps) {
  const user = await getCurrentUser()

  const { id } = await params

  if (!user.managerOSOrganizationId) {
    redirect('/dashboard')
  }

  // Get the person
  const person = await prisma.person.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!person) {
    notFound()
  }

  // Get the current user's person ID from session
  if (!user.managerOSPersonId) {
    redirect('/people')
  }

  // Fetch the full person record
  const currentPerson = await prisma.person.findUnique({
    where: {
      id: user.managerOSPersonId,
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

  const pathname = `/people/${person.id}/feedback-campaigns/new`
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'People', href: '/people' },
    { name: person.name, href: `/people/${person.id}` },
    { name: 'Feedback 360', href: `/people/${person.id}/feedback-campaigns` },
    { name: 'New Campaign', href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold'>Create Feedback 360</h1>
          <p className='text-neutral-400'>
            Create a Feedback 360 for {person.name}. External stakeholders will
            be invited to provide feedback.
          </p>
        </div>

        <FeedbackCampaignForm
          person={person}
          redirectTo={`/people/${person.id}/feedback-campaigns`}
        />
      </div>
    </PageBreadcrumbSetter>
  )
}
