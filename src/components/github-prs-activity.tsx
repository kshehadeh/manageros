'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { fetchGithubPullRequests } from '@/lib/actions/github'
import { ExternalLink } from '@/components/ui/link'

interface GithubPrsActivityProps {
  personId: string
  personName: string
  hasGithubAccount: boolean
}

interface PullRequestItem {
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

export function GithubPrsActivity({
  personId,
  hasGithubAccount,
}: GithubPrsActivityProps) {
  const [pullRequests, setPullRequests] = useState<PullRequestItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [daysBack, setDaysBack] = useState(30)

  const handleFetchFromGithub = async () => {
    setIsFetching(true)
    setError(null)

    try {
      const result = await fetchGithubPullRequests(personId, daysBack)
      if (result.success && result.pullRequests) {
        setPullRequests(result.pullRequests)
      } else {
        setError(result.error || 'Failed to fetch pull requests')
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch pull requests from GitHub'
      )
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    const loadPullRequests = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await fetchGithubPullRequests(personId, daysBack)
        if (result.success && result.pullRequests) {
          setPullRequests(result.pullRequests)
        } else {
          setError(result.error || 'Failed to load pull requests')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load pull requests'
        )
      } finally {
        setIsLoading(false)
      }
    }
    if (hasGithubAccount) {
      loadPullRequests()
    }
  }, [personId, hasGithubAccount, daysBack])

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

  const getStateColor = (
    state: string,
    draft: boolean,
    mergedAt: string | null
  ): string => {
    if (draft) {
      return 'bg-badge-neutral/30 text-badge-neutral-text border-badge-neutral'
    }
    if (mergedAt) {
      return 'bg-badge-success/30 text-badge-success-text border-badge-success'
    }
    if (state === 'closed') {
      return 'bg-badge-error/30 text-badge-error-text border-badge-error'
    }
    if (state === 'open') {
      return 'bg-badge-info/30 text-badge-info-text border-badge-info'
    }
    return 'bg-badge-neutral/30 text-badge-neutral-text border-badge-neutral'
  }

  const getStateText = (
    state: string,
    draft: boolean,
    mergedAt: string | null
  ): string => {
    if (draft) return 'Draft'
    if (mergedAt) return 'Merged'
    if (state === 'closed') return 'Closed'
    if (state === 'open') return 'Open'
    return state
  }

  if (!hasGithubAccount) {
    return null
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h4 className='text-sm font-medium text-foreground'>
          Recent Pull Requests
        </h4>
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
          <Button
            type='button'
            onClick={handleFetchFromGithub}
            disabled={isFetching}
            variant='outline'
          >
            {isFetching ? 'Fetching...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <div className='rounded-md bg-badge-error/20 border-badge-error p-3'>
          <div className='text-sm text-badge-error-text'>{error}</div>
        </div>
      )}

      {isLoading ? (
        <div className='flex justify-center py-4'>
          <div className='text-sm text-muted-foreground'>
            Loading pull requests...
          </div>
        </div>
      ) : pullRequests.length === 0 ? (
        <div className='rounded-md bg-card border p-4'>
          <p className='text-sm text-muted-foreground'>
            No pull requests found for the selected time period.
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {pullRequests.map(item => (
            <div key={item.id} className='rounded-md border bg-card p-4'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center space-x-2'>
                    <span className='font-medium text-primary'>
                      #{item.number}
                    </span>
                    <span className='text-sm text-muted-foreground'>
                      {item.repository.name}
                    </span>
                  </div>
                  <h5 className='mt-1 text-sm font-medium text-card-foreground'>
                    {item.title}
                  </h5>
                  <ExternalLink
                    href={item.repository.htmlUrl}
                    className='text-xs text-muted-foreground hover:text-foreground'
                  >
                    {item.repository.fullName}
                  </ExternalLink>
                </div>
                <div className='ml-4 text-right'>
                  <div className='text-sm font-medium text-card-foreground'>
                    {formatRelativeDate(item.updatedAt)}
                  </div>
                  <div className='text-xs text-muted-foreground'>Updated</div>
                </div>
              </div>

              <div className='mt-3 flex items-center space-x-2'>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStateColor(item.state, item.draft, item.mergedAt)}`}
                >
                  {getStateText(item.state, item.draft, item.mergedAt)}
                </span>
                {item.draft && (
                  <span className='text-xs text-muted-foreground'>Draft</span>
                )}
              </div>

              <div className='mt-3 flex items-center justify-between'>
                <ExternalLink
                  href={item.htmlUrl}
                  className='text-xs text-primary hover:underline'
                >
                  View on GitHub →
                </ExternalLink>
                <div className='text-xs text-muted-foreground'>
                  Created {formatDate(item.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
