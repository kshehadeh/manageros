'use client'

import { useState, useEffect } from 'react'
import { fetchGithubMetrics } from '@/lib/actions/github'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FaGithub } from 'react-icons/fa'
import { GitBranch, GitMerge } from 'lucide-react'

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMetrics = async () => {
      if (!hasGithubAccount) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const result = await fetchGithubMetrics(personId, 30)
        if (result.success) {
          setMetrics(result.metrics)
        } else {
          setError('Failed to load GitHub metrics')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load GitHub metrics'
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadMetrics()
  }, [personId, hasGithubAccount])

  // Don't render anything if no GitHub account
  if (!hasGithubAccount) {
    return null
  }

  const header = (
    <SectionHeader
      icon={FaGithub}
      title='GitHub Activity'
      description='Last 30 days'
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
            Loading GitHub metrics...
          </div>
        </div>
      </PageSection>
    )
  }

  // Don't render if there are no PRs
  if (metrics.total === 0) {
    return null
  }

  return (
    <PageSection header={header}>
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
    </PageSection>
  )
}
