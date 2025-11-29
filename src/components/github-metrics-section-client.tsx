'use client'

import { GitPullRequest, ExternalLink } from 'lucide-react'
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

interface GithubPRListProps {
  pullRequests: GithubPR[]
}

export function GithubPRList({ pullRequests }: GithubPRListProps) {
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

  if (pullRequests.length === 0) {
    return null
  }

  return (
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
                <span className='text-sm font-medium truncate'>{pr.title}</span>
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
  )
}
