import { requireAuth } from '@/lib/auth-utils'
import { getPendingInvitationsForUser } from '@/lib/actions/organization'
import { OrganizationSetupCards } from '@/components/organization-setup-cards'
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
    const pendingInvitations = await getPendingInvitationsForUser()

    return (
      <div className='page-container'>
        <OrganizationSetupCards pendingInvitations={pendingInvitations} />
      </div>
    )
  }

  // Sections render below using independent Suspense-wrapped server components

  return (
    <div className='page-container'>
      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Main Content Area */}
        <div className='flex-1 space-y-6'>
          <Suspense fallback={<TasksSectionFallback />}>
            <DashboardAssignedTasksSection
              organizationId={user.organizationId!}
            />
          </Suspense>

          <Suspense fallback={<FeedbackCampaignsSectionFallback />}>
            <DashboardFeedbackCampaignsSection />
          </Suspense>

          <Suspense fallback={<OpenInitiativesSectionFallback />}>
            <DashboardOpenInitiativesSection
              organizationId={user.organizationId!}
            />
          </Suspense>

          <div className='grid gap-6 md:grid-cols-2'>
            <Suspense fallback={<RecentOneOnOnesSectionFallback />}>
              <DashboardRecentOneOnOnesSection userId={user.id} />
            </Suspense>
          </div>

          <Suspense fallback={<UpcomingMeetingsSectionFallback />}>
            <DashboardUpcomingMeetingsSection
              userId={user.id}
              organizationId={user.organizationId!}
            />
          </Suspense>
        </div>

        {/* Right Sidebar */}
        <div className='w-full lg:w-80 space-y-6'>
          <Suspense fallback={<RelatedTeamsSectionFallback />}>
            <DashboardRelatedTeamsSection
              userId={user.id}
              organizationId={user.organizationId!}
            />
          </Suspense>

          <Suspense fallback={<DirectReportsSectionFallback />}>
            <DashboardDirectReportsSection
              userId={user.id}
              organizationId={user.organizationId!}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
