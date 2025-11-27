'use client'

import { useState, useEffect } from 'react'
import {
  fetchGithubMetrics,
  fetchGithubPullRequests,
} from '@/lib/actions/github'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FaGithub } from 'react-icons/fa'
import { GitBranch, GitMerge, GitPullRequest, ExternalLink } from 'lucide-react'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface GithubPR {
  id: number
  number: number
  title: string
  state: string
  draft: boolean
  htmlUrl: string
  createdAt: string
  updatedAt: string
  closedAt: string | null
  mergedAt: string | null
  repository: {
    name: string
    fullName: string
    htmlUrl: string
  }
  author: {
    login: string
    avatarUrl: string
  }
}

interface GithubMetricsSectionProps {
  personId: string
  hasGithubAccount: boolean
}

export function GithubMetricsSection({
  personId,
  hasGithubAccount,
}: GithubMetricsSectionProps) {
  const [metrics, setMetrics] = useState<{
    openPrs: number
    mergedPrs: number
    total: number
  } | null>(null)
  const [pullRequests, setPullRequests] = useState<GithubPR[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!hasGithubAccount) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Fetch metrics and PRs in parallel (14 days = 2 weeks)
        const [metricsResult, prsResult] = await Promise.all([
          fetchGithubMetrics(personId, 14),
          fetchGithubPullRequests(personId, 14),
        ])

        if (metricsResult.success) {
          setMetrics(metricsResult.metrics)
        } else {
          setError('Failed to load GitHub metrics')
        }

        if (prsResult.success && prsResult.pullRequests) {
          setPullRequests(prsResult.pullRequests)
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load GitHub data'
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [personId, hasGithubAccount])

  // Don't render anything if no GitHub account
  if (!hasGithubAccount) {
    return null
  }

  const header = (
    <SectionHeader
      icon={FaGithub}
      title='GitHub Activity'
      description='Last 2 weeks'
    />
  )

  // Don't render if there's an error
  if (error) {
    return (
      <PageSection header={header}>
        <div className='rounded-md bg-badge-error/20 border-badge-error p-3'>
          <div className='text-sm text-badge-error-text'>{error}</div>
        </div>
      </PageSection>
    )
  }

  // Show loading state
  if (isLoading || metrics === null) {
    return (
      <PageSection header={header}>
        <div className='flex justify-center py-4'>
          <div className='text-sm text-muted-foreground'>
            Loading GitHub activity...
          </div>
        </div>
      </PageSection>
    )
  }

  // Don't render if there are no PRs
  if (metrics.total === 0) {
    return null
  }

  const getPRStatusBadge = (pr: GithubPR) => {
    if (pr.mergedAt) {
      return (
        <Badge
          variant='outline'
          className='text-xs bg-badge-success/20 text-badge-success border-badge-success'
        >
          Merged
        </Badge>
      )
    }
    if (pr.state === 'closed') {
      return (
        <Badge
          variant='outline'
          className='text-xs bg-muted text-muted-foreground border-muted-foreground'
        >
          Closed
        </Badge>
      )
    }
    if (pr.draft) {
      return (
        <Badge
          variant='outline'
          className='text-xs bg-muted text-muted-foreground border-muted-foreground'
        >
          Draft
        </Badge>
      )
    }
    return (
      <Badge
        variant='outline'
        className='text-xs bg-badge-info/20 text-badge-info border-badge-info'
      >
        Open
      </Badge>
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
              <CardTitle className='text-sm font-medium'>Merged PRs</CardTitle>
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
        {pullRequests.length > 0 && (
          <div className='space-y-2'>
            <h4 className='text-sm font-medium text-muted-foreground'>
              Recent Pull Requests
            </h4>
            <SimpleListItemsContainer useDividers={false}>
              {pullRequests.map(pr => (
                <SimpleListItem
                  key={pr.id}
                  onClick={() => window.open(pr.htmlUrl, '_blank')}
                >
                  <div className='flex items-center gap-3 flex-1 min-w-0'>
                    <GitPullRequest className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                    <div className='flex flex-col min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-mono text-muted-foreground'>
                          #{pr.number}
                        </span>
                        {getPRStatusBadge(pr)}
                      </div>
                      <span className='text-sm font-medium truncate'>
                        {pr.title}
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        {pr.repository.fullName} · Updated{' '}
                        {formatDistanceToNow(new Date(pr.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                </SimpleListItem>
              ))}
            </SimpleListItemsContainer>
          </div>
        )}
      </div>
    </PageSection>
  )
}
