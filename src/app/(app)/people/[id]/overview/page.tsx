import { notFound, redirect } from 'next/navigation'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'
import { getPersonById } from '@/lib/data/people'
import { getLatestPersonOverview } from '@/lib/actions/person-overview'
import { OverviewPageContent } from '@/components/people/overview/overview-page-content'
import { PageBreadcrumbSetter } from '../../../../../components/page-breadcrumb-setter'

interface OverviewPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const user = await getCurrentUser()

  const { id } = await params

  if (!user.managerOSOrganizationId) {
    redirect('/dashboard')
  }

  // Get the person
  const person = await getPersonById(id, user.managerOSOrganizationId)

  if (!person || !('id' in person) || typeof person.id !== 'string') {
    notFound()
  }

  // Check if user can access overviews for this person
  const canAccessOverview = await getActionPermission(
    user,
    'person.overview.view',
    person.id
  )

  if (!canAccessOverview) {
    redirect(`/people/${person.id}`)
  }

  // Get the latest overview
  let overview = null
  try {
    overview = await getLatestPersonOverview(person.id)
  } catch (error) {
    // If no overview exists or access denied, overview remains null
    console.error('Error fetching overview:', error)
  }

  // Check if person has integration accounts
  const hasJiraAccount = !!('jiraAccount' in person && person.jiraAccount)
  const hasGithubAccount = !!('githubAccount' in person && person.githubAccount)

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'People', href: '/people' },
    { name: person.name, href: `/people/${person.id}` },
    { name: 'Overview', href: `/people/${person.id}/overview` },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <OverviewPageContent
        personId={person.id}
        personName={person.name}
        canGenerate={canAccessOverview}
        hasOverview={!!overview}
        overviewContent={overview?.content}
        overviewUpdatedAt={overview?.updatedAt}
        overviewFromDate={overview?.fromDate}
        overviewToDate={overview?.toDate}
        overviewLookbackDays={overview?.lookbackDays}
        hasJiraAccount={hasJiraAccount}
        hasGithubAccount={hasGithubAccount}
      />
    </PageBreadcrumbSetter>
  )
}
