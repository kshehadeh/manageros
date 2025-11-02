'use client'

import { useState, useEffect } from 'react'
import { fetchJiraMetrics } from '@/lib/actions/jira'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FaJira } from 'react-icons/fa'
import { CheckCircle2, PlayCircle, Circle } from 'lucide-react'

interface JiraMetricsSectionProps {
  personId: string
  hasJiraAccount: boolean
}

export function JiraMetricsSection({
  personId,
  hasJiraAccount,
}: JiraMetricsSectionProps) {
  const [metrics, setMetrics] = useState<{
    completed: number
    inProgress: number
    notStarted: number
    total: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMetrics = async () => {
      if (!hasJiraAccount) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const result = await fetchJiraMetrics(personId, 30)
        if (result.success) {
          setMetrics(result.metrics)
        } else {
          setError('Failed to load Jira metrics')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load Jira metrics'
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadMetrics()
  }, [personId, hasJiraAccount])

  // Don't render anything if no Jira account
  if (!hasJiraAccount) {
    return null
  }

  const header = (
    <SectionHeader
      icon={FaJira}
      title='Jira Activity'
      description='Last 30 days'
    />
  )

  // Don't render if there's an error or no data
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
            Loading Jira metrics...
          </div>
        </div>
      </PageSection>
    )
  }

  // Don't render if there are no tickets
  if (metrics.total === 0) {
    return null
  }

  return (
    <PageSection header={header}>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='bg-muted/40 border-0 rounded-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Completed</CardTitle>
            <CheckCircle2 className='h-4 w-4 text-badge-success' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-badge-success'>
              {metrics.completed}
            </div>
          </CardContent>
        </Card>

        <Card className='bg-muted/40 border-0 rounded-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>In Progress</CardTitle>
            <PlayCircle className='h-4 w-4 text-badge-info' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-badge-info'>
              {metrics.inProgress}
            </div>
          </CardContent>
        </Card>

        <Card className='bg-muted/40 border-0 rounded-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Not Started</CardTitle>
            <Circle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-foreground'>
              {metrics.notStarted}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageSection>
  )
}
