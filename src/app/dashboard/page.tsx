import { requireAuth } from '@/lib/auth-utils'
import { DashboardOrganizationSetup } from '@/components/dashboard-organization-setup'
import { Suspense } from 'react'
import { DashboardAssignedTasksSection } from '@/components/dashboard-sections/assigned-tasks-section'
import { DashboardOpenInitiativesSection } from '@/components/dashboard-sections/open-initiatives-section'
import { DashboardDirectReportsSection } from '@/components/dashboard-sections/direct-reports-section'
import { DashboardRelatedTeamsSection } from '@/components/dashboard-sections/related-teams-section'
import { DashboardRecentOneOnOnesSection } from '@/components/dashboard-sections/recent-oneonones-section'
import { DashboardFeedbackCampaignsSection } from '@/components/dashboard-sections/feedback-campaigns-section'
import { DashboardUpcomingMeetingsSection } from '@/components/dashboard-sections/upcoming-meetings-section'
import {
  TasksSectionFallback,
  FeedbackCampaignsSectionFallback,
  OpenInitiativesSectionFallback,
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
        <div className='flex-1 space-y-6'>
          <Suspense fallback={<TasksSectionFallback />}>
            <DashboardAssignedTasksSection personId={user.personId!} />
          </Suspense>

          <Suspense fallback={<FeedbackCampaignsSectionFallback />}>
            <DashboardFeedbackCampaignsSection />
          </Suspense>

          <Suspense fallback={<OpenInitiativesSectionFallback />}>
            <DashboardOpenInitiativesSection
              organizationId={user.organizationId!}
            />
          </Suspense>

          <Suspense fallback={<RecentOneOnOnesSectionFallback />}>
            <DashboardRecentOneOnOnesSection />
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
