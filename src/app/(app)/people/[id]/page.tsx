import { PersonDetailClient } from '@/components/people/person-detail-client'
import { PersonDetailContent } from '@/components/people/person-detail-content'
import type { PersonWithDetailRelations } from '@/components/people/person-detail-content'
import { notFound } from 'next/navigation'

import { isAdmin } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { getLinkedAccountAvatars } from '@/lib/actions/avatar'
import { getPersonById } from '@/lib/data/people'
import { getFeedbackCountForPerson } from '@/lib/data/feedback'
import { getCurrentUser } from '@/lib/auth-utils'

interface PersonDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps) {
  const user = await getCurrentUser()

  const { id } = await params

  if (!user.organizationId) {
    redirect('/organization/create')
  }

  const personResult = await getPersonById(id, user.organizationId)

  if (
    !personResult ||
    !('id' in personResult) ||
    typeof personResult.id !== 'string'
  ) {
    notFound()
  }

  // Get feedback count for this person (respecting privacy rules)
  // Use user.personId directly - no need to fetch from database
  const feedbackCount = await getFeedbackCountForPerson(
    personResult.id,
    user.personId || undefined
  )

  // Add level field to match Person type requirements
  // Type assertion needed because Prisma types don't exactly match Person type
  const personWithLevel = {
    ...personResult,
    level: 0, // Default level, can be calculated based on hierarchy if needed
  } as unknown as typeof personResult & { level: number }

  // Get linked account avatars
  let linkedAvatars: { jiraAvatar?: string; githubAvatar?: string } = {}
  try {
    linkedAvatars = await getLinkedAccountAvatars(id)
  } catch (error) {
    console.error('Error fetching linked account avatars:', error)
  }

  return (
    <PersonDetailClient
      personName={personWithLevel.name}
      personId={personWithLevel.id as string}
    >
      <PersonDetailContent
        person={personWithLevel as PersonWithDetailRelations}
        linkedAvatars={linkedAvatars}
        isAdmin={isAdmin(user)}
        currentPersonId={user.personId || undefined}
        organizationId={user.organizationId}
        currentUserId={user.id}
        feedbackCount={feedbackCount}
      />
    </PersonDetailClient>
  )
}
