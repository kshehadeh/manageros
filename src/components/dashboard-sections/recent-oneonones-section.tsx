'use client'

import Link from 'next/link'
import { ExpandableSection } from '@/components/expandable-section'
import { useOneOnOnes } from '@/hooks/use-oneonones'
import { useSession } from 'next-auth/react'
import { Skeleton } from '@/components/ui/skeleton'

function RecentOneOnOnesSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className='block card'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-8 w-full' />
          </div>
        </div>
      ))}
    </>
  )
}

export function DashboardRecentOneOnOnesSection() {
  const { data: session, status } = useSession()
  const currentUserId = session?.user?.id

  const { data, loading, error } = useOneOnOnes({
    sort: 'scheduledAt:desc',
    limit: 10,
    enabled: status !== 'loading',
  })

  if (error) {
    console.error('Error loading recent one-on-ones:', error)
    return null
  }

  const recentOneOnOnes = data?.oneOnOnes || []

  return (
    <ExpandableSection
      title='Recent 1:1s'
      icon='Handshake'
      viewAllHref='/oneonones'
    >
      {loading || status === 'loading' ? (
        <RecentOneOnOnesSkeleton />
      ) : !recentOneOnOnes || recentOneOnOnes.length === 0 ? null : (
        recentOneOnOnes.map(oneOnOne => (
          <Link
            key={oneOnOne.id}
            href={`/oneonones/${oneOnOne.id}`}
            className='block card hover:bg-accent/50 transition-colors'
          >
            <div className='space-y-1'>
              <div className='font-medium text-foreground'>
                {oneOnOne.manager?.user?.id === currentUserId ? (
                  <span>
                    With{' '}
                    <span className='hover:text-primary transition-colors'>
                      {oneOnOne.report.name}
                    </span>
                  </span>
                ) : (
                  <span>
                    With{' '}
                    <span className='hover:text-primary transition-colors'>
                      {oneOnOne.manager.name}
                    </span>
                  </span>
                )}
              </div>
              <div className='text-xs text-muted-foreground'>
                {oneOnOne.scheduledAt
                  ? new Date(oneOnOne.scheduledAt).toLocaleDateString()
                  : 'TBD'}
              </div>
              {oneOnOne.notes && (
                <div
                  className='text-sm text-muted-foreground break-words'
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {oneOnOne.notes}
                </div>
              )}
            </div>
          </Link>
        ))
      )}
    </ExpandableSection>
  )
}
