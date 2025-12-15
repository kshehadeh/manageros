import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { getPersonById } from '@/lib/data/people'
import { getOnboardingForPerson } from '@/lib/actions/onboarding-instance'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'
import { PersonOnboardingView } from '@/components/people/onboarding/person-onboarding-view'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, Layers } from 'lucide-react'

interface OnboardingPageProps {
  params: Promise<{
    id: string
  }>
}

function OnboardingPageSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Progress Overview Skeleton */}
      <PageSection
        header={<SectionHeader icon={BarChart3} title='Progress Overview' />}
      >
        <div className='space-y-4'>
          <div>
            <div className='flex items-center justify-between mb-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-32' />
            </div>
            <Skeleton className='h-3 w-full' />
          </div>
          <div className='flex gap-4'>
            <Skeleton className='h-6 w-40' />
            <Skeleton className='h-6 w-40' />
          </div>
        </div>
      </PageSection>

      {/* Phases Skeleton */}
      <PageSection header={<SectionHeader icon={Layers} title='Phases' />}>
        <div className='space-y-4'>
          {[1, 2, 3].map(i => (
            <div key={i} className='border rounded-lg p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Skeleton className='h-5 w-5' />
                  <div>
                    <Skeleton className='h-5 w-32' />
                    <Skeleton className='h-4 w-20 mt-1' />
                  </div>
                </div>
                <Skeleton className='h-2 w-24' />
              </div>
            </div>
          ))}
        </div>
      </PageSection>
    </div>
  )
}

export default async function PersonOnboardingPage({
  params,
}: OnboardingPageProps) {
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

  // Get onboarding for this person
  const onboarding = await getOnboardingForPerson(person.id)

  if (!onboarding) {
    notFound()
  }

  // Check if current user can manage this onboarding (manager, mentor, or admin)
  const isAdmin = isAdminOrOwner(user)
  const currentPersonId = user.managerOSPersonId
  const isManager = onboarding.managerId === currentPersonId
  const isMentor = onboarding.mentorId === currentPersonId
  const isSelf = person.id === currentPersonId
  const canManage = isAdmin || isManager || isMentor

  const pathname = `/people/${person.id}/onboarding`
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'People', href: '/people' },
    { name: person.name, href: `/people/${person.id}` },
    { name: 'Onboarding', href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title={`${person.name}'s Onboarding`}
          subtitle={onboarding.template.name}
        />

        <PageContent>
          <PageMain>
            <Suspense fallback={<OnboardingPageSkeleton />}>
              <PersonOnboardingView
                onboarding={onboarding}
                personName={person.name}
                canManage={canManage}
                isSelf={isSelf}
              />
            </Suspense>
          </PageMain>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
