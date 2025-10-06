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
import { fetchGithubPullRequests } from '@/lib/actions/github'

interface GithubPrsActivityTableProps {
  personId: string
  personName: string
  hasGithubAccount: boolean
  daysBack: number
  refreshTrigger: number
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

export function GithubPrsActivityTable({
  personId,
  hasGithubAccount,
  daysBack,
  refreshTrigger,
}: GithubPrsActivityTableProps) {
  const [pullRequests, setPullRequests] = useState<PullRequestItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  }, [personId, hasGithubAccount, daysBack, refreshTrigger])

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
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[100px]'>PR ID</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead className='w-[150px]'>Repository</TableHead>
                <TableHead className='w-[100px]'>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pullRequests.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <a
                      href={item.htmlUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='font-medium text-primary hover:underline'
                    >
                      #{item.number}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className='max-w-[300px]'>
                      <div className='truncate font-medium text-card-foreground'>
                        {item.title}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='text-sm text-muted-foreground'>
                      {item.repository.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={`text-xs ${getStateColor(item.state, item.draft, item.mergedAt)}`}
                    >
                      {getStateText(item.state, item.draft, item.mergedAt)}
                    </Badge>
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
