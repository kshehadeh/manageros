import Link from 'next/link'
import { prisma } from '@/lib/db'
import { ExpandableSection } from '@/components/expandable-section'

interface DashboardRecentOneOnOnesSectionProps {
  userId: string
}

export async function DashboardRecentOneOnOnesSection({
  userId,
}: DashboardRecentOneOnOnesSectionProps) {
  const recentOneOnOnes = await prisma.oneOnOne.findMany({
    where: {
      OR: [
        { manager: { user: { id: userId } } },
        { report: { user: { id: userId } } },
      ],
    },
    orderBy: { scheduledAt: 'desc' },
    include: {
      manager: { include: { user: true } },
      report: { include: { user: true } },
    },
  })

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
              {oneOnOne.manager?.user?.id === userId ? (
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
