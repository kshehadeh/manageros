import { Suspense } from 'react'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Activity, ArrowLeft } from 'lucide-react'
import { GithubMetricsSection } from '@/components/github-metrics-section'
import { JiraMetricsSection } from '@/components/jira-metrics-section'
import { GithubMetricsSectionSkeleton } from '@/components/github-metrics-section-skeleton'
import { JiraMetricsSectionSkeleton } from '@/components/jira-metrics-section-skeleton'
import { ActivityTasksSection } from './activity-tasks-section'
import { ActivityInitiativesSection } from './activity-initiatives-section'
import { ActivityTasksSectionSkeleton } from './activity-tasks-section-skeleton'
import { ActivityInitiativesSectionSkeleton } from './activity-initiatives-section-skeleton'
import { ActivityDateRangeWrapper } from './activity-date-range-wrapper'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'
import type { DateRangePreset } from './date-range-dropdown'

interface ActivityPageContentProps {
  personId: string
  personName: string
  hasJiraAccount: boolean
  hasGithubAccount: boolean
  organizationId: string
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function getDefaultDateRange() {
  const today = endOfDay(new Date())
  const from = startOfDay(subDays(today, 30))
  return {
    from: from.toISOString(),
    to: today.toISOString(),
  }
}

function parseDateRangeFromSearchParams(searchParams: {
  [key: string]: string | string[] | undefined
}): {
  from: string
  to: string
  preset?: DateRangePreset
} {
  const preset = searchParams.preset as DateRangePreset | undefined
  const fromParam = searchParams.from as string | undefined
  const toParam = searchParams.to as string | undefined

  if (preset && preset !== 'custom') {
    const today = endOfDay(new Date())
    let from: Date

    switch (preset) {
      case 'yesterday':
        from = startOfDay(subDays(today, 1))
        break
      case 'last-week':
        from = startOfDay(subDays(today, 7))
        break
      case 'last-2-weeks':
        from = startOfDay(subDays(today, 14))
        break
      case 'last-month':
        from = startOfDay(subDays(today, 30))
        break
      default:
        from = startOfDay(subDays(today, 30))
    }

    return {
      from: from.toISOString(),
      to: today.toISOString(),
      preset,
    }
  }

  if (fromParam && toParam) {
    return {
      from: fromParam,
      to: toParam,
      preset: 'custom',
    }
  }

  return {
    ...getDefaultDateRange(),
    preset: 'last-month',
  }
}

function formatLookbackPeriod(dateRange: {
  from: string
  to: string
  preset?: DateRangePreset
}): string {
  if (dateRange.preset) {
    switch (dateRange.preset) {
      case 'yesterday':
        return 'Yesterday'
      case 'last-week':
        return 'Last Week'
      case 'last-2-weeks':
        return 'Last 2 Weeks'
      case 'last-month':
        return 'Last Month'
      case 'custom':
        return `From ${format(new Date(dateRange.from), 'MMM d, yyyy')}`
      default:
        return 'Last Month'
    }
  }

  // Fallback: format the date range
  const fromDate = new Date(dateRange.from)
  const toDate = new Date(dateRange.to)
  return `From ${format(fromDate, 'MMM d, yyyy')} to ${format(toDate, 'MMM d, yyyy')}`
}

export async function ActivityPageContent({
  personId,
  personName,
  hasJiraAccount,
  hasGithubAccount,
  organizationId,
  searchParams,
}: ActivityPageContentProps) {
  const resolvedSearchParams = await searchParams
  const dateRange = parseDateRangeFromSearchParams(resolvedSearchParams)

  // Calculate days back from the date range
  const fromDate = new Date(dateRange.from)
  const toDate = new Date(dateRange.to)
  const daysBack = Math.max(
    1,
    Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
  )

  const hasAnyIntegration = hasJiraAccount || hasGithubAccount
  const lookbackPeriod = formatLookbackPeriod(dateRange)

  return (
    <PageContainer>
      <PageHeader
        title={`${personName}'s Activity`}
        titleIcon={Activity}
        subtitle={lookbackPeriod}
        actions={
          <ActivityDateRangeWrapper>
            <Button asChild variant='outline'>
              <Link
                href={`/people/${personId}`}
                className='flex items-center gap-2'
              >
                <ArrowLeft className='w-4 h-4' />
                Back to Profile
              </Link>
            </Button>
          </ActivityDateRangeWrapper>
        }
      />

      <PageContent>
        <PageMain>
          <div className='flex gap-lg flex-wrap space-y-6'>
            {/* Tasks Section */}
            <Suspense fallback={<ActivityTasksSectionSkeleton />}>
              <ActivityTasksSection
                personId={personId}
                organizationId={organizationId}
                dateRangeFrom={dateRange.from}
                dateRangeTo={dateRange.to}
              />
            </Suspense>

            {/* Initiatives Section */}
            <Suspense fallback={<ActivityInitiativesSectionSkeleton />}>
              <ActivityInitiativesSection
                personId={personId}
                organizationId={organizationId}
                dateRangeFrom={dateRange.from}
                dateRangeTo={dateRange.to}
              />
            </Suspense>

            {/* Jira Metrics */}
            <Suspense fallback={<JiraMetricsSectionSkeleton />}>
              <JiraMetricsSection
                personId={personId}
                hasJiraAccount={hasJiraAccount}
                daysBack={daysBack}
              />
            </Suspense>

            {/* GitHub Metrics */}
            <Suspense fallback={<GithubMetricsSectionSkeleton />}>
              <GithubMetricsSection
                personId={personId}
                hasGithubAccount={hasGithubAccount}
                daysBack={daysBack}
              />
            </Suspense>

            {/* Empty state when no data available */}
            {!hasAnyIntegration && (
              <div className='text-center py-12 text-muted-foreground'>
                <Activity className='w-12 h-12 mx-auto mb-4 opacity-50' />
                <p className='text-lg font-medium mb-2'>
                  No activity data available
                </p>
                <p className='text-sm'>
                  Link Jira or GitHub accounts to see work activity.
                </p>
              </div>
            )}
          </div>
        </PageMain>
      </PageContent>
    </PageContainer>
  )
}
