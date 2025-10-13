import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { PersonFeedbackPageClient } from '@/components/feedback/person-feedback-page-client'

interface PersonFeedbackPageProps {
  params: Promise<{
    aboutPersonId: string
  }>
}

export default async function PersonFeedbackPage({
  params,
}: PersonFeedbackPageProps) {
  await requireAuth({ requireOrganization: true })

  const { aboutPersonId } = await params

  // Get the person to verify they exist and show their name
  const person = await prisma.person.findUnique({
    where: {
      id: aboutPersonId,
    },
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  })

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
