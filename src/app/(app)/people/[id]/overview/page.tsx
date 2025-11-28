import { notFound, redirect } from 'next/navigation'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'
import { getPersonById } from '@/lib/data/people'
import { getLatestPersonOverview } from '@/lib/actions/person-overview'
import { OverviewBreadcrumbClient } from '@/components/people/overview/overview-breadcrumb-client'
import { OverviewPageContent } from '@/components/people/overview/overview-page-content'

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

  return (
    <OverviewBreadcrumbClient personName={person.name} personId={person.id}>
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
      />
    </OverviewBreadcrumbClient>
  )
}
