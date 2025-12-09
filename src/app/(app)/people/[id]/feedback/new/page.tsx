import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'

import { FeedbackForm } from '@/components/feedback/feedback-form'
import { getCurrentUser } from '@/lib/auth-utils'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

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

  if (!user.managerOSOrganizationId) {
    redirect('/dashboard')
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

  const pathname = `/people/${person.id}/feedback/new`
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'People', href: '/people' },
    { name: person.name, href: `/people/${person.id}` },
    { name: 'New Feedback', href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
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
    </PageBreadcrumbSetter>
  )
}
