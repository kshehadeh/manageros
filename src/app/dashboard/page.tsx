import { requireAuth } from '@/lib/auth-utils'
import { DashboardOrganizationSetup } from '@/components/dashboard-organization-setup'
import { Suspense } from 'react'
import { DashboardAssignedTasksServerSection } from '@/components/dashboard-sections/assigned-tasks-section-server'
import { DashboardOpenInitiativesServerSection } from '@/components/dashboard-sections/open-initiatives-section-server'
import { DashboardDirectReportsSection } from '@/components/dashboard-sections/direct-reports-section'
import { DashboardRelatedTeamsSection } from '@/components/dashboard-sections/related-teams-section'
import { DashboardRecentOneOnOnesServerSection } from '@/components/dashboard-sections/recent-oneonones-section-server'
import { DashboardFeedbackCampaignsServerSection } from '@/components/dashboard-sections/feedback-campaigns-section-server'
import { DashboardUpcomingMeetingsSection } from '@/components/dashboard-sections/upcoming-meetings-section'
import {
  TasksServerSectionFallback,
  OpenInitiativesServerSectionFallback,
  FeedbackCampaignsSectionFallback,
  RecentOneOnOnesSectionFallback,
  RelatedTeamsSectionFallback,
  DirectReportsSectionFallback,
  UpcomingMeetingsSectionFallback,
} from '@/components/dashboard-sections/section-fallbacks'

export default async function Home() {
  const user = await requireAuth()

  // If user doesn't have an organization, show organization setup cards
  if (!user.organizationId) {
    return <DashboardOrganizationSetup />
  }

  // Sections now fetch their own data via API routes on the client side

  return (
    <div className='page-container'>
      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Main Content Area */}
        <div
          className='flex-1'
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(min(100%, 400px), 1fr))',
            gap: '1.5rem',
            alignItems: 'start',
          }}
        >
          <Suspense fallback={<TasksServerSectionFallback />}>
            <DashboardAssignedTasksServerSection personId={user.personId} />
          </Suspense>

          <Suspense fallback={<FeedbackCampaignsSectionFallback />}>
            <DashboardFeedbackCampaignsServerSection />
          </Suspense>

          <Suspense fallback={<OpenInitiativesServerSectionFallback />}>
            <DashboardOpenInitiativesServerSection
              organizationId={user.organizationId!}
              personId={user.personId}
            />
          </Suspense>

          <Suspense fallback={<RecentOneOnOnesSectionFallback />}>
            <DashboardRecentOneOnOnesServerSection personId={user.personId} />
          </Suspense>

          <Suspense fallback={<UpcomingMeetingsSectionFallback />}>
            <DashboardUpcomingMeetingsSection />
          </Suspense>
        </div>

        {/* Right Sidebar */}
        <div className='w-full lg:w-80 space-y-6'>
          <Suspense fallback={<RelatedTeamsSectionFallback />}>
            <DashboardRelatedTeamsSection />
          </Suspense>

          <Suspense fallback={<DirectReportsSectionFallback />}>
            <DashboardDirectReportsSection />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
