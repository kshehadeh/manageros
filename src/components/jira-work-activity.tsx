'use client'

import { useState, useEffect } from 'react'
import { fetchJiraAssignedTickets } from '@/lib/actions'

interface JiraAssignedTicketsProps {
  personId: string
  personName: string
  hasJiraAccount: boolean
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

export function JiraWorkActivity({
  personId,
  hasJiraAccount,
}: JiraAssignedTicketsProps) {
  const [assignedTickets, setAssignedTickets] = useState<AssignedTicketItem[]>(
    []
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [daysBack, setDaysBack] = useState(30)

  const handleFetchFromJira = async () => {
    setIsFetching(true)
    setError(null)

    try {
      const result = await fetchJiraAssignedTickets(personId, daysBack)
      if (result.success) {
        setAssignedTickets(result.tickets)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch assigned tickets from Jira'
      )
    } finally {
      setIsFetching(false)
    }
  }

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
  }, [personId, hasJiraAccount, daysBack])

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    return formatDate(dateString)
  }

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase()
    if (
      statusLower.includes('done') ||
      statusLower.includes('closed') ||
      statusLower.includes('resolved')
    ) {
      return 'bg-green-900/30 text-green-400 border border-green-800'
    }
    if (statusLower.includes('progress') || statusLower.includes('review')) {
      return 'bg-blue-900/30 text-blue-400 border border-blue-800'
    }
    if (statusLower.includes('blocked') || statusLower.includes('waiting')) {
      return 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
    }
    return 'bg-neutral-800 text-neutral-400 border border-neutral-700'
  }

  const getPriorityColor = (priority?: string | null): string => {
    if (!priority)
      return 'bg-neutral-800 text-neutral-400 border border-neutral-700'

    const priorityLower = priority.toLowerCase()
    if (priorityLower.includes('high') || priorityLower.includes('critical')) {
      return 'bg-red-900/30 text-red-400 border border-red-800'
    }
    if (priorityLower.includes('medium')) {
      return 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
    }
    if (priorityLower.includes('low')) {
      return 'bg-green-900/30 text-green-400 border border-green-800'
    }
    return 'bg-neutral-800 text-neutral-400 border border-neutral-700'
  }

  if (!hasJiraAccount) {
    return (
      <div className='rounded-md bg-neutral-800 border border-neutral-700 p-4'>
        <p className='text-sm text-neutral-400'>
          This person is not linked to a Jira account. Link their account to
          view work activity.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h4 className='text-sm font-medium text-white'>Assigned Tickets</h4>
        <div className='flex items-center space-x-2'>
          <select
            value={daysBack}
            onChange={e => setDaysBack(Number(e.target.value))}
            className='input'
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            type='button'
            onClick={handleFetchFromJira}
            disabled={isFetching}
            className='btn'
          >
            {isFetching ? 'Fetching...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className='rounded-md bg-red-900/20 border border-red-800 p-3'>
          <div className='text-sm text-red-400'>{error}</div>
        </div>
      )}

      {isLoading ? (
        <div className='flex justify-center py-4'>
          <div className='text-sm text-neutral-500'>
            Loading assigned tickets...
          </div>
        </div>
      ) : assignedTickets.length === 0 ? (
        <div className='rounded-md bg-neutral-800 border border-neutral-700 p-4'>
          <p className='text-sm text-neutral-400'>
            No assigned tickets found for the selected time period.
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {assignedTickets.map(item => (
            <div
              key={item.id}
              className='rounded-md border border-neutral-700 bg-neutral-800 p-4'
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center space-x-2'>
                    <span className='font-medium text-blue-400'>
                      {item.jiraIssueKey}
                    </span>
                    <span className='text-sm text-neutral-400'>
                      {item.projectKey}
                    </span>
                  </div>
                  <h5 className='mt-1 text-sm font-medium text-white'>
                    {item.issueTitle}
                  </h5>
                </div>
                <div className='ml-4 text-right'>
                  <div className='text-sm font-medium text-white'>
                    {formatRelativeDate(item.lastUpdated)}
                  </div>
                  <div className='text-xs text-neutral-500'>Updated</div>
                </div>
              </div>

              <div className='mt-3 flex items-center space-x-2'>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(item.status)}`}
                >
                  {item.status}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(item.priority)}`}
                >
                  {item.priority || 'No Priority'}
                </span>
                <span className='text-xs text-neutral-500'>
                  {item.issueType}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
