'use client'

import Link from 'next/link'
import { ExpandableSection } from '@/components/expandable-section'
import { useOneOnOnes } from '@/hooks/use-oneonones'
import { useSession } from 'next-auth/react'

export function DashboardRecentOneOnOnesSection() {
  const { data: session, status } = useSession()
  const currentUserId = session?.user?.id

  const { data, loading, error } = useOneOnOnes({
    sort: 'scheduledAt:desc',
    limit: 10,
    enabled: status !== 'loading',
  })

  if (loading || status === 'loading') {
    return (
      <ExpandableSection
        title='Recent 1:1s'
        icon='Handshake'
        viewAllHref='/oneonones'
      >
        <div className='flex items-center justify-center py-8'>
          <div className='text-muted-foreground'>Loading...</div>
        </div>
      </ExpandableSection>
    )
  }

  if (error) {
    console.error('Error loading recent one-on-ones:', error)
    return null
  }

  const recentOneOnOnes = data?.oneOnOnes || []

  if (!recentOneOnOnes || recentOneOnOnes.length === 0) return null

  return (
    <ExpandableSection
      title='Recent 1:1s'
      icon='Handshake'
      viewAllHref='/oneonones'
    >
      {recentOneOnOnes.map(oneOnOne => (
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
      ))}
    </ExpandableSection>
  )
}
