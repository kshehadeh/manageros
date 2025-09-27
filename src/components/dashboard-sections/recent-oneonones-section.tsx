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
    <ExpandableSection title='Recent 1:1s' viewAllHref='/oneonones'>
      {recentOneOnOnes.map(oneOnOne => (
        <Link
          key={oneOnOne.id}
          href={`/oneonones/${oneOnOne.id}`}
          className='block card hover:bg-neutral-800/60'
        >
          <div className='flex items-center justify-between'>
            <div>
              <div className='font-medium'>
                {oneOnOne.manager?.user?.id === userId ? (
                  <span>
                    With <span className='hover:text-blue-400'>{oneOnOne.report.name}</span>
                  </span>
                ) : (
                  <span>
                    With <span className='hover:text-blue-400'>{oneOnOne.manager.name}</span>
                  </span>
                )}
              </div>
              <div className='text-xs text-neutral-500 mt-1'>
                {oneOnOne.scheduledAt ? new Date(oneOnOne.scheduledAt).toLocaleDateString() : 'TBD'}
              </div>
            </div>
            <div className='text-xs text-neutral-500'>
              {oneOnOne.manager?.user?.id === userId ? 'Manager' : 'Report'}
            </div>
          </div>
        </Link>
      ))}
    </ExpandableSection>
  )
}

