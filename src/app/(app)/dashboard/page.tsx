import { DashboardOrganizationSetup } from '@/components/dashboard-organization-setup'
import { Suspense } from 'react'
import { HighlightsSectionServer } from '@/components/dashboard-sections/highlights-section-server'
import { TodaysPrioritiesSectionServer } from '@/components/dashboard-sections/todays-priorities-section-server'
import { ActiveInitiativesSectionServer } from '@/components/dashboard-sections/active-initiatives-section-server'
import { TeamPulseSectionServer } from '@/components/dashboard-sections/team-pulse-section-server'
import { getCurrentUser } from '@/lib/auth-utils'
import { PageContainer } from '@/components/ui/page-container'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { HelpBlock } from '@/components/common/help-block'
import { User, Users } from 'lucide-react'
import { prisma } from '@/lib/db'

async function DashboardContent() {
  const user = await getCurrentUser()

  // If user doesn't have an organization, show organization setup cards
  if (!user.organizationId) {
    return <DashboardOrganizationSetup />
  }

  // Check if there are any people in the organization
  const peopleCount = await prisma.person.count({
    where: {
      organizationId: user.organizationId,
    },
  })

  const hasNoPeople = peopleCount === 0

  // Check if user needs to be linked to a person
  // Admins and owners don't need to be linked to a person
  const needsPersonLink =
    !user.personId && user.role !== 'ADMIN' && user.role !== 'OWNER'

  return (
    <PageContainer>
      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            {hasNoPeople && (
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
              <Alert className='border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 [&>svg]:text-yellow-600 [&>svg]:dark:text-yellow-400'>
                <User className='h-4 w-4' />
                <AlertTitle className='text-yellow-800 dark:text-yellow-200'>
                  Account Not Linked
                </AlertTitle>
                <AlertDescription className='text-yellow-700 dark:text-yellow-300'>
                  Your account is not currently linked to a person in the
                  organization. Please contact an organization administrator to
                  link your account to a person so you can perform basic actions
                  like creating tasks, meetings, and initiatives.
                </AlertDescription>
              </Alert>
            )}

            {!needsPersonLink && (
              <Suspense
                fallback={
                  <div className='h-24 bg-muted/50 rounded-lg animate-pulse' />
                }
              >
                <HighlightsSectionServer />
              </Suspense>
            )}

            <Suspense
              fallback={
                <div className='h-64 bg-muted/50 rounded-lg animate-pulse' />
              }
            >
              <TodaysPrioritiesSectionServer />
            </Suspense>

            <Suspense
              fallback={
                <div className='h-64 bg-muted/50 rounded-lg animate-pulse' />
              }
            >
              <ActiveInitiativesSectionServer
                organizationId={user.organizationId}
                personId={user.personId}
              />
            </Suspense>
          </div>
        </PageMain>

        <PageSidebar>
          <Suspense
            fallback={
              <div className='h-96 bg-muted/50 rounded-lg animate-pulse' />
            }
          >
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
