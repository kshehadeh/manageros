import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getPendingInvitationsForUser } from '@/lib/actions'
import PendingInvitations from '@/components/pending-invitations'
import { Suspense } from 'react'
import { DashboardAssignedTasksSection } from '@/components/dashboard-sections/assigned-tasks-section'
import { DashboardOpenInitiativesSection } from '@/components/dashboard-sections/open-initiatives-section'
import { DashboardDirectReportsSection } from '@/components/dashboard-sections/direct-reports-section'
import { DashboardRelatedTeamsSection } from '@/components/dashboard-sections/related-teams-section'
import { DashboardRecentOneOnOnesSection } from '@/components/dashboard-sections/recent-oneonones-section'
import { DashboardRecentFeedbackSection } from '@/components/dashboard-sections/recent-feedback-section'
import { DashboardFeedbackCampaignsSection } from '@/components/dashboard-sections/feedback-campaigns-section'
import {
  TasksSectionFallback,
  FeedbackCampaignsSectionFallback,
  RecentFeedbackSectionFallback,
  OpenInitiativesSectionFallback,
  RecentOneOnOnesSectionFallback,
  RelatedTeamsSectionFallback,
  DirectReportsSectionFallback,
} from '@/components/dashboard-sections/section-fallbacks'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // If user doesn't have an organization, show organization creation prompt and pending invitations
  if (!session.user.organizationId) {
    const pendingInvitations = await getPendingInvitationsForUser()

    return (
      <div className='space-y-6'>
        {/* Show pending invitations first if any exist */}
        {pendingInvitations.length > 0 && (
          <PendingInvitations invitations={pendingInvitations} />
        )}

        <div className='card text-center py-12'>
          <h2 className='text-xl font-semibold mb-4'>Welcome to ManagerOS!</h2>
          <p className='text-neutral-400 mb-6'>
            {pendingInvitations.length > 0
              ? 'You can accept one of the invitations above or create a new organization.'
              : "To get started, you'll need to create an organization or be invited to an existing one."}
          </p>
          <div className='flex justify-center gap-4'>
            <Button asChild variant='outline'>
              <Link href='/organization/create'>Create Organization</Link>
            </Button>
            <Button asChild variant='outline'>
              <Link href='/teams'>Browse Teams</Link>
            </Button>
          </div>
        </div>
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
              organizationId={session.user.organizationId!}
            />
          </Suspense>

          <Suspense fallback={<FeedbackCampaignsSectionFallback />}>
            <DashboardFeedbackCampaignsSection />
          </Suspense>

          <Suspense fallback={<RecentFeedbackSectionFallback />}>
            <DashboardRecentFeedbackSection
              userId={session.user.id}
              organizationId={session.user.organizationId!}
            />
          </Suspense>

          <Suspense fallback={<OpenInitiativesSectionFallback />}>
            <DashboardOpenInitiativesSection
              organizationId={session.user.organizationId!}
            />
          </Suspense>

          <div className='grid gap-6 md:grid-cols-2'>
            <Suspense fallback={<RecentOneOnOnesSectionFallback />}>
              <DashboardRecentOneOnOnesSection userId={session.user.id} />
            </Suspense>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className='w-80 space-y-6'>
          <Suspense fallback={<RelatedTeamsSectionFallback />}>
            <DashboardRelatedTeamsSection
              userId={session.user.id}
              organizationId={session.user.organizationId!}
            />
          </Suspense>

          <Suspense fallback={<DirectReportsSectionFallback />}>
            <DashboardDirectReportsSection
              userId={session.user.id}
              organizationId={session.user.organizationId!}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
