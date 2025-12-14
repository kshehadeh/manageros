import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { HighlightsSectionServer } from '@/components/dashboard-sections/highlights-section-server'
import { TodaysPrioritiesSectionServer } from '@/components/dashboard-sections/todays-priorities-section-server'
import { ActiveInitiativesSectionServer } from '@/components/dashboard-sections/active-initiatives-section-server'
import { TeamPulseSectionServer } from '@/components/dashboard-sections/team-pulse-section-server'
import { OnboardingSection } from '@/components/dashboard-sections/onboarding-section'
import { OnboardingProgressSectionServer } from '@/components/onboarding/onboarding-progress-section-server'
import { OnboardingManagerSection } from '@/components/onboarding/onboarding-manager-section'
import {
  HighlightsSectionSkeleton,
  TodaysPrioritiesSectionSkeleton,
  ActiveInitiativesSectionSkeleton,
  TeamPulseSectionSkeleton,
} from '@/components/dashboard-sections/dashboard-section-skeletons'
import { PageContainer } from '@/components/ui/page-container'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { HelpBlock } from '@/components/common/help-block'
import { User, Users } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'

async function DashboardContent() {
  const user = await getCurrentUser()

  // If user doesn't have an organization, redirect to route handler that sets cookie
  // This handles the case where user was removed from an organization
  if (!user.managerOSOrganizationId) {
    redirect('/api/auth/org-removed')
  }

  // Check if there are any people in the organization
  const peopleCount = await prisma.person.count({
    where: {
      organizationId: user.managerOSOrganizationId,
    },
  })

  const hasNoPeople = peopleCount === 0
  const isAdmin = isAdminOrOwner(user)
  const hasLinkedSelf = !!user.managerOSPersonId

  // Check if organization is configured (has job roles, levels, or domains)
  const [jobRolesCount, jobLevelsCount, jobDomainsCount] = await Promise.all([
    prisma.jobRole.count({
      where: { organizationId: user.managerOSOrganizationId },
    }),
    prisma.jobLevel.count({
      where: { organizationId: user.managerOSOrganizationId },
    }),
    prisma.jobDomain.count({
      where: { organizationId: user.managerOSOrganizationId },
    }),
  ])
  const isOrganizationConfigured =
    jobRolesCount > 0 || jobLevelsCount > 0 || jobDomainsCount > 0

  // Check if user needs to be linked to a person
  // Admins and owners don't need to be linked to a person
  const needsPersonLink = !user.managerOSPersonId && !isAdmin

  return (
    <PageContainer>
      <PageContent>
        <PageMain>
          <div className='space-y-10'>
            {/* Show onboarding section for admins with new organizations */}
            <OnboardingSection
              hasAddedPeople={!hasNoPeople}
              hasLinkedSelf={hasLinkedSelf}
              isAdmin={isAdmin}
              isOrganizationConfigured={isOrganizationConfigured}
            />

            {/* Show legacy help blocks for non-admins or as fallback */}
            {hasNoPeople && !isAdmin && (
              <HelpBlock
                title='No People in Organization'
                description="You don't have any people in your organization yet. Add people to get started with managing your team, creating tasks, scheduling meetings, and tracking initiatives."
                icon={Users}
                variant='info'
                action={{
                  label: 'Go to People Page',
                  href: '/people',
                  variant: 'outline',
                  size: 'sm',
                }}
              />
            )}

            {needsPersonLink && (
              <HelpBlock
                title='Account Not Linked'
                description='Your account is not currently linked to a person in the organization. Please contact an organization administrator to link your account to a person so you can perform basic actions like creating tasks, meetings, and initiatives.'
                icon={User}
                variant='warning'
              />
            )}

            {!needsPersonLink && (
              <Suspense fallback={<HighlightsSectionSkeleton />}>
                <HighlightsSectionServer />
              </Suspense>
            )}

            <Suspense fallback={<TodaysPrioritiesSectionSkeleton />}>
              <TodaysPrioritiesSectionServer />
            </Suspense>

            <Suspense fallback={<ActiveInitiativesSectionSkeleton />}>
              <ActiveInitiativesSectionServer
                organizationId={user.managerOSOrganizationId}
                personId={user.managerOSPersonId || null}
              />
            </Suspense>
          </div>
        </PageMain>

        <PageSidebar>
          {/* Show user's onboarding progress if they have active onboarding */}
          <Suspense fallback={null}>
            <OnboardingProgressSectionServer />
          </Suspense>

          {/* Show manager's team onboarding if they have direct reports being onboarded */}
          <Suspense fallback={null}>
            <OnboardingManagerSection />
          </Suspense>

          <Suspense fallback={<TeamPulseSectionSkeleton />}>
            <TeamPulseSectionServer />
          </Suspense>
        </PageSidebar>
      </PageContent>
    </PageContainer>
  )
}

export default function Home() {
  return <DashboardContent />
}
