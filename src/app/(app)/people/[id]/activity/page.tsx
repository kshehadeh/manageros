import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth-utils'
import { getPersonById } from '@/lib/data/people'
import { ActivityBreadcrumbClient } from '@/components/people/activity/activity-breadcrumb-client'
import { ActivityPageContent } from '@/components/people/activity/activity-page-content'

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

  return (
    <ActivityBreadcrumbClient personName={person.name} personId={person.id}>
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
    </ActivityBreadcrumbClient>
  )
}
