import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { PersonFeedbackPageClient } from '@/components/feedback/person-feedback-page-client'
import { Suspense } from 'react'
import { RequireAuthServer } from '@/components/auth/require-auth-server'
import { getOptionalUser } from '@/lib/auth-utils'

interface PersonFeedbackPageProps {
  params: Promise<{
    aboutPersonId: string
  }>
}

async function PersonFeedbackPageContent({
  aboutPersonId,
}: {
  aboutPersonId: string
}) {
  const user = await getOptionalUser()

  // RequireAuthServer ensures organizationId exists, but we check again for type safety
  if (!user?.organizationId) {
    notFound()
  }

  // Get the person and verify they belong to the current user's organization
  const person = await prisma.person.findFirst({
    where: {
      id: aboutPersonId,
      organizationId: user.organizationId, // Ensure same organization
    },
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  })

  // Return 404 if person not found or belongs to different organization
  if (!person) {
    notFound()
  }

  return (
    <PersonFeedbackPageClient
      aboutPersonId={aboutPersonId}
      personName={person.name}
    />
  )
}

export default async function PersonFeedbackPage({
  params,
}: PersonFeedbackPageProps) {
  const { aboutPersonId } = await params

  return (
    <Suspense fallback={<div className='page-container'>Loading...</div>}>
      <RequireAuthServer requireOrganization={true}>
        <PersonFeedbackPageContent aboutPersonId={aboutPersonId} />
      </RequireAuthServer>
    </Suspense>
  )
}
