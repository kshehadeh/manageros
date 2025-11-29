'use client'

import { ExternalLink } from 'lucide-react'
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

interface JiraTicketListProps {
  tickets: JiraTicket[]
  jiraBaseUrl: string | null
}

export function JiraTicketList({ tickets, jiraBaseUrl }: JiraTicketListProps) {
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

  if (tickets.length === 0) {
    return null
  }

  return (
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
                ticketUrl ? () => window.open(ticketUrl, '_blank') : undefined
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
  )
}
