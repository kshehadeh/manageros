import {
  fetchGithubMetrics,
  fetchGithubPullRequests,
} from '@/lib/actions/github'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FaGithub } from 'react-icons/fa'
import { GitBranch, GitMerge } from 'lucide-react'
import { GithubPRList } from './github-metrics-section-client'

interface GithubMetricsSectionProps {
  personId: string
  hasGithubAccount: boolean
  daysBack?: number
}

export async function GithubMetricsSection({
  personId,
  hasGithubAccount,
  daysBack = 14,
}: GithubMetricsSectionProps) {
  // Don't render anything if no GitHub account
  if (!hasGithubAccount) {
    return null
  }

  const header = <SectionHeader icon={FaGithub} title='GitHub Activity' />

  try {
    // Fetch metrics and PRs in parallel
    const [metricsResult, prsResult] = await Promise.all([
      fetchGithubMetrics(personId, daysBack),
      fetchGithubPullRequests(personId, daysBack),
    ])

    // Handle errors
    if (!metricsResult.success) {
      return (
        <PageSection header={header} className='flex-1 min-w-[400px]'>
          <div className='rounded-md bg-badge-error/20 border-badge-error p-3'>
            <div className='text-sm text-badge-error-text'>
              {metricsResult.error || 'Failed to load GitHub metrics'}
            </div>
          </div>
        </PageSection>
      )
    }

    const metrics = metricsResult.metrics
    const pullRequests =
      prsResult.success && prsResult.pullRequests ? prsResult.pullRequests : []

    // Show empty state if there are no PRs
    if (metrics.total === 0) {
      return (
        <PageSection header={header} className='flex-1 min-w-[400px]'>
          <div className='text-center py-8 text-sm text-muted-foreground'>
            No GitHub activity in this period.
          </div>
        </PageSection>
      )
    }

    return (
      <PageSection header={header} className='flex-1 min-w-[400px]'>
        <div className='space-y-6'>
          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Card className='bg-muted/40 border-0 rounded-md'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Open PRs</CardTitle>
                <GitBranch className='h-4 w-4 text-badge-info' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-badge-info'>
                  {metrics.openPrs}
                </div>
              </CardContent>
            </Card>

            <Card className='bg-muted/40 border-0 rounded-md'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Merged PRs
                </CardTitle>
                <GitMerge className='h-4 w-4 text-badge-success' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-badge-success'>
                  {metrics.mergedPrs}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PR List */}
          <GithubPRList pullRequests={pullRequests} />
        </div>
      </PageSection>
    )
  } catch (err) {
    return (
      <PageSection header={header} className='flex-1 min-w-[400px]'>
        <div className='rounded-md bg-badge-error/20 border-badge-error p-3'>
          <div className='text-sm text-badge-error-text'>
            {err instanceof Error ? err.message : 'Failed to load GitHub data'}
          </div>
        </div>
      </PageSection>
    )
  }
}
