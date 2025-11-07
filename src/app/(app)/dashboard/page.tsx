import { DashboardOrganizationSetup } from '@/components/dashboard-organization-setup'
import { Suspense } from 'react'
import { HighlightsSectionServer } from '@/components/dashboard-sections/highlights-section-server'
import { TodaysPrioritiesSectionServer } from '@/components/dashboard-sections/todays-priorities-section-server'
import { ActiveInitiativesSectionServer } from '@/components/dashboard-sections/active-initiatives-section-server'
import { TeamPulseSectionServer } from '@/components/dashboard-sections/team-pulse-section-server'
import { getOptionalUser } from '@/lib/auth-utils'
import { PageContainer } from '@/components/ui/page-container'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'

async function DashboardContent() {
  const user = await getOptionalUser()

  // If user doesn't have an organization, show organization setup cards
  if (!user?.organizationId) {
    return <DashboardOrganizationSetup />
  }

  return (
    <PageContainer>
      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            <Suspense
              fallback={
                <div className='h-24 bg-muted/50 rounded-lg animate-pulse' />
              }
            >
              <HighlightsSectionServer />
            </Suspense>

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
