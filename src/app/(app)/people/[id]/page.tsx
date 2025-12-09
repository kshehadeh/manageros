import { PersonDetailContent } from '@/components/people/person-detail-content'
import type { PersonWithDetailRelations } from '@/components/people/person-detail-content'
import { notFound } from 'next/navigation'

import { isAdmin } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { getLinkedAccountAvatars } from '@/lib/actions/avatar'
import { getPersonById } from '@/lib/data/people'
import { getCurrentUser } from '@/lib/auth-utils'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

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

  if (!user.managerOSOrganizationId) {
    redirect('/dashboard')
  }

  const personResult = await getPersonById(id, user.managerOSOrganizationId)

  if (
    !personResult ||
    !('id' in personResult) ||
    typeof personResult.id !== 'string'
  ) {
    notFound()
  }

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

  const pathname = `/people/${personWithLevel.id}`
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'People', href: '/people' },
    { name: personWithLevel.name, href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PersonDetailContent
        person={personWithLevel as PersonWithDetailRelations}
        linkedAvatars={linkedAvatars}
        isAdmin={isAdmin(user)}
        currentPersonId={user.managerOSPersonId || undefined}
        organizationId={user.managerOSOrganizationId}
        currentUserId={user.managerOSUserId || ''}
      />
    </PageBreadcrumbSetter>
  )
}
