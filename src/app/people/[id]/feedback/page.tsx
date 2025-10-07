import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { FeedbackSection } from '@/components/people/sections/feedback-section'
import { FeedbackBreadcrumbClient } from '@/components/feedback/feedback-breadcrumb-client'

interface FeedbackPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id } = await params

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  // Get the person with all necessary relations
  const person = await prisma.person.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      team: true,
      manager: {
        include: {
          reports: true,
        },
      },
      reports: true,
      jobRole: {
        include: {
          level: true,
          domain: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      jiraAccount: true,
      githubAccount: true,
    },
  })

  // Add level field to match Person type requirements
  const personWithLevel = person
    ? {
        ...person,
        level: 0, // Default level, can be calculated based on hierarchy if needed
      }
    : null

  if (!personWithLevel) {
    notFound()
  }

  return (
    <FeedbackBreadcrumbClient
      personName={personWithLevel.name}
      personId={personWithLevel.id}
    >
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold'>Feedback</h2>
            <p className='text-sm text-neutral-400 mt-1'>
              Feedback about {personWithLevel.name}
            </p>
          </div>
        </div>

        <FeedbackSection person={personWithLevel} />
      </div>
    </FeedbackBreadcrumbClient>
  )
}
