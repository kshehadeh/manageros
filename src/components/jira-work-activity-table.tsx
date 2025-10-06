'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchJiraAssignedTickets, getJiraBaseUrl } from '@/lib/actions/jira'

interface JiraWorkActivityTableProps {
  personId: string
  personName: string
  hasJiraAccount: boolean
  daysBack: number
  refreshTrigger: number
}

interface AssignedTicketItem {
  id: string
  jiraIssueKey: string
  issueTitle: string
  issueType: string
  status: string
  priority?: string | null
  projectKey: string
  projectName: string
  lastUpdated: string
  created: string
}

export function JiraWorkActivityTable({
  personId,
  hasJiraAccount,
  daysBack,
  refreshTrigger,
}: JiraWorkActivityTableProps) {
  const [assignedTickets, setAssignedTickets] = useState<AssignedTicketItem[]>(
    []
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadJiraBaseUrl = async () => {
      try {
        const baseUrl = await getJiraBaseUrl()
        setJiraBaseUrl(baseUrl)
      } catch (err) {
        console.error('Failed to load Jira base URL:', err)
      }
    }
    loadJiraBaseUrl()
  }, [])

  useEffect(() => {
    const loadAssignedTickets = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await fetchJiraAssignedTickets(personId, daysBack)
        if (result.success) {
          setAssignedTickets(result.tickets)
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load assigned tickets'
        )
      } finally {
        setIsLoading(false)
      }
    }
    if (hasJiraAccount) {
      loadAssignedTickets()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId, hasJiraAccount, refreshTrigger])

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase()
    if (
      statusLower.includes('done') ||
      statusLower.includes('closed') ||
      statusLower.includes('resolved')
    ) {
      return 'bg-badge-success/30 text-badge-success-text border-badge-success'
    }
    if (statusLower.includes('progress') || statusLower.includes('review')) {
      return 'bg-badge-info/30 text-badge-info-text border-badge-info'
    }
    if (statusLower.includes('blocked') || statusLower.includes('waiting')) {
      return 'bg-badge-warning/30 text-badge-warning-text border-badge-warning'
    }
    return 'bg-badge-neutral/30 text-badge-neutral-text border-badge-neutral'
  }

  // Get Jira URL using the actual base URL from user credentials
  const getJiraUrl = (issueKey: string): string => {
    if (jiraBaseUrl) {
      return `${jiraBaseUrl}/browse/${issueKey}`
    }
    // Fallback to generic URL if base URL is not available
    const projectKey = issueKey.split('-')[0]
    return `https://${projectKey.toLowerCase()}.atlassian.net/browse/${issueKey}`
  }

  if (!hasJiraAccount) {
    return null
  }

  return (
    <div className='space-y-4'>
      {error && (
        <div className='rounded-md bg-badge-error/20 border-badge-error p-3'>
          <div className='text-sm text-badge-error-text'>{error}</div>
        </div>
      )}

      {isLoading ? (
        <div className='flex justify-center py-4'>
          <div className='text-sm text-muted-foreground'>
            Loading assigned tickets...
          </div>
        </div>
      ) : assignedTickets.length === 0 ? (
        <div className='rounded-md bg-card border p-4'>
          <p className='text-sm text-muted-foreground'>
            No assigned tickets found for the selected time period.
          </p>
        </div>
      ) : (
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[120px]'>Key</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead className='w-[100px]'>Status</TableHead>
                <TableHead className='w-[120px]'>Issue Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedTickets.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <a
                      href={getJiraUrl(item.jiraIssueKey)}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='font-medium text-primary hover:underline'
                    >
                      {item.jiraIssueKey}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className='font-medium text-card-foreground'>
                        {item.issueTitle}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {item.projectKey}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={`text-xs ${getStatusColor(item.status)} whitespace-nowrap`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className='text-sm text-muted-foreground whitespace-nowrap'>
                      {item.issueType}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
