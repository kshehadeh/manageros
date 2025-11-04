import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { PersonFeedbackPageClient } from '@/components/feedback/person-feedback-page-client'
import { getOptionalUser } from '@/lib/auth-utils'

interface PersonFeedbackPageProps {
  params: Promise<{
    aboutPersonId: string
  }>
}

export default async function PersonFeedbackPage({
  params,
}: PersonFeedbackPageProps) {
  const { aboutPersonId } = await params
  const user = await getOptionalUser()

  // Middleware ensures authentication, but we check organizationId for type safety
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
