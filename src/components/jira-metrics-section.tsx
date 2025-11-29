import {
  fetchJiraMetrics,
  fetchJiraAssignedTickets,
  getJiraBaseUrl,
} from '@/lib/actions/jira'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FaJira } from 'react-icons/fa'
import { CheckCircle2, PlayCircle, Circle } from 'lucide-react'
import { JiraTicketList } from './jira-metrics-section-client'

interface JiraMetricsSectionProps {
  personId: string
  hasJiraAccount: boolean
  daysBack?: number
}

export async function JiraMetricsSection({
  personId,
  hasJiraAccount,
  daysBack = 7,
}: JiraMetricsSectionProps) {
  // Don't render anything if no Jira account
  if (!hasJiraAccount) {
    return null
  }

  const header = <SectionHeader icon={FaJira} title='Jira Activity' />

  try {
    // Fetch metrics and tickets in parallel
    const [metricsResult, ticketsResult, baseUrl] = await Promise.all([
      fetchJiraMetrics(personId, daysBack),
      fetchJiraAssignedTickets(personId, daysBack),
      getJiraBaseUrl(),
    ])

    // Handle errors
    if (!metricsResult.success) {
      return (
        <PageSection header={header} className='flex-1 min-w-[400px]'>
          <div className='rounded-md bg-badge-error/20 border-badge-error p-3'>
            <div className='text-sm text-badge-error-text'>
              {metricsResult.error || 'Failed to load Jira metrics'}
            </div>
          </div>
        </PageSection>
      )
    }

    const metrics = metricsResult.metrics
    const tickets = ticketsResult.success ? ticketsResult.tickets : []

    // Show empty state if there are no tickets
    if (metrics.total === 0) {
      return (
        <PageSection header={header} className='flex-1 min-w-[400px]'>
          <div className='text-center py-8 text-sm text-muted-foreground'>
            No Jira activity in this period.
          </div>
        </PageSection>
      )
    }

    return (
      <PageSection header={header} className='flex-1 min-w-[400px]'>
        <div className='space-y-6'>
          {/* Stats Cards */}
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
                <CardTitle className='text-sm font-medium'>
                  In Progress
                </CardTitle>
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
                <CardTitle className='text-sm font-medium'>
                  Not Started
                </CardTitle>
                <Circle className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-foreground'>
                  {metrics.notStarted}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ticket List */}
          <JiraTicketList tickets={tickets} jiraBaseUrl={baseUrl} />
        </div>
      </PageSection>
    )
  } catch (err) {
    return (
      <PageSection header={header} className='flex-1 min-w-[400px]'>
        <div className='rounded-md bg-badge-error/20 border-badge-error p-3'>
          <div className='text-sm text-badge-error-text'>
            {err instanceof Error ? err.message : 'Failed to load Jira data'}
          </div>
        </div>
      </PageSection>
    )
  }
}
