'use client'

import { useState, useEffect } from 'react'
import {
  fetchJiraMetrics,
  fetchJiraAssignedTickets,
  getJiraBaseUrl,
} from '@/lib/actions/jira'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FaJira } from 'react-icons/fa'
import { CheckCircle2, PlayCircle, Circle, ExternalLink } from 'lucide-react'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface JiraTicket {
  id: string
  jiraIssueKey: string
  issueTitle: string
  issueType: string
  status: string
  priority?: string
  projectKey: string
  projectName: string
  lastUpdated: string
  created: string
}

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
  const [tickets, setTickets] = useState<JiraTicket[]>([])
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!hasJiraAccount) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Fetch metrics and tickets in parallel
        const [metricsResult, ticketsResult, baseUrl] = await Promise.all([
          fetchJiraMetrics(personId, 7),
          fetchJiraAssignedTickets(personId, 7),
          getJiraBaseUrl(),
        ])

        if (metricsResult.success) {
          setMetrics(metricsResult.metrics)
        } else {
          setError('Failed to load Jira metrics')
        }

        if (ticketsResult.success) {
          setTickets(ticketsResult.tickets)
        }

        setJiraBaseUrl(baseUrl)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load Jira data'
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [personId, hasJiraAccount])

  // Don't render anything if no Jira account
  if (!hasJiraAccount) {
    return null
  }

  const header = (
    <SectionHeader
      icon={FaJira}
      title='Jira Activity'
      description='Last 7 days'
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
            Loading Jira activity...
          </div>
        </div>
      </PageSection>
    )
  }

  // Don't render if there are no tickets
  if (metrics.total === 0) {
    return null
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (
      statusLower.includes('done') ||
      statusLower.includes('closed') ||
      statusLower.includes('resolved') ||
      statusLower.includes('complete')
    ) {
      return 'bg-badge-success/20 text-badge-success border-badge-success'
    }
    if (
      statusLower.includes('progress') ||
      statusLower.includes('review') ||
      statusLower.includes('testing')
    ) {
      return 'bg-badge-info/20 text-badge-info border-badge-info'
    }
    return 'bg-muted text-muted-foreground border-muted-foreground'
  }

  const getTicketUrl = (issueKey: string) => {
    if (jiraBaseUrl) {
      return `${jiraBaseUrl}/browse/${issueKey}`
    }
    return null
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

        {/* Ticket List */}
        {tickets.length > 0 && (
          <div className='space-y-2'>
            <h4 className='text-sm font-medium text-muted-foreground'>
              Recent Tickets
            </h4>
            <SimpleListItemsContainer useDividers={false}>
              {tickets.map(ticket => {
                const ticketUrl = getTicketUrl(ticket.jiraIssueKey)
                return (
                  <SimpleListItem
                    key={ticket.id}
                    onClick={
                      ticketUrl
                        ? () => window.open(ticketUrl, '_blank')
                        : undefined
                    }
                  >
                    <div className='flex items-center gap-3 flex-1 min-w-0'>
                      <div className='flex flex-col min-w-0 flex-1'>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs font-mono text-muted-foreground'>
                            {ticket.jiraIssueKey}
                          </span>
                          <Badge
                            variant='outline'
                            className={`text-xs ${getStatusColor(ticket.status)}`}
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                        <span className='text-sm font-medium truncate'>
                          {ticket.issueTitle}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          {ticket.projectName} · Updated{' '}
                          {formatDistanceToNow(new Date(ticket.lastUpdated), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    {ticketUrl && (
                      <ExternalLink className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                    )}
                  </SimpleListItem>
                )
              })}
            </SimpleListItemsContainer>
          </div>
        )}
      </div>
    </PageSection>
  )
}
