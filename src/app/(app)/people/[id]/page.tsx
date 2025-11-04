import { PersonDetailClient } from '@/components/people/person-detail-client'
import { PersonDetailContent } from '@/components/people/person-detail-content'
import type { PersonWithDetailRelations } from '@/components/people/person-detail-content'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getLinkedAccountAvatars } from '@/lib/actions/avatar'
import { getPersonById } from '@/lib/data/people'
import { getFeedbackCountForPerson } from '@/lib/data/feedback'

interface PersonDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id } = await params

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const personResult = await getPersonById(id, session.user.organizationId, {
    includeTeam: true,
    includeManager: true,
    includeReports: true,
    includeJobRole: true,
    includeUser: true,
    includeJiraAccount: true,
    includeGithubAccount: true,
  })

  if (
    !personResult ||
    !('id' in personResult) ||
    typeof personResult.id !== 'string'
  ) {
    notFound()
  }

  // Get feedback count for this person (respecting privacy rules)
  // Use session.user.personId directly - no need to fetch from database
  const feedbackCount = await getFeedbackCountForPerson(
    personResult.id,
    session.user.personId || undefined
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
        isAdmin={isAdmin(session.user)}
        currentPersonId={session.user.personId || undefined}
        organizationId={session.user.organizationId}
        currentUserId={session.user.id}
        feedbackCount={feedbackCount}
      />
    </PersonDetailClient>
  )
}
