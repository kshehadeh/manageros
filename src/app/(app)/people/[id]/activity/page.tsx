import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth-utils'
import { getPersonById } from '@/lib/data/people'
import { ActivityPageContent } from '@/components/people/activity/activity-page-content'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

interface ActivityPageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ActivityPage({
  params,
  searchParams,
}: ActivityPageProps) {
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

  const pathname = `/people/${person.id}/activity`
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'People', href: '/people' },
    { name: person.name, href: `/people/${person.id}` },
    { name: 'Activity', href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <Suspense fallback={<div>Loading...</div>}>
        <ActivityPageContent
          personId={person.id}
          personName={person.name}
          hasJiraAccount={Boolean(person.jiraAccount)}
          hasGithubAccount={Boolean(person.githubAccount)}
          organizationId={user.managerOSOrganizationId}
          searchParams={searchParams}
        />
      </Suspense>
    </PageBreadcrumbSetter>
  )
}
