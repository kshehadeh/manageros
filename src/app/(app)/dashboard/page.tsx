import { DashboardOrganizationSetup } from '@/components/dashboard-organization-setup'
import { Suspense } from 'react'
import { HighlightsSectionServer } from '@/components/dashboard-sections/highlights-section-server'
import { TodaysPrioritiesSectionServer } from '@/components/dashboard-sections/todays-priorities-section-server'
import { ActiveInitiativesSectionServer } from '@/components/dashboard-sections/active-initiatives-section-server'
import { TeamPulseSectionServer } from '@/components/dashboard-sections/team-pulse-section-server'
import { getOptionalUser } from '@/lib/auth-utils'

async function DashboardContent() {
  const user = await getOptionalUser()

  // If user doesn't have an organization, show organization setup cards
  if (!user?.organizationId) {
    return <DashboardOrganizationSetup />
  }

  return (
    <div className='page-container'>
      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Main Content Area */}
        <div className='flex-1 space-y-6'>
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

        {/* Right Sidebar */}
        <div className='w-full lg:w-80'>
          <Suspense
            fallback={
              <div className='h-96 bg-muted/50 rounded-lg animate-pulse' />
            }
          >
            <TeamPulseSectionServer />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return <DashboardContent />
}
