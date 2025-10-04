import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface OneOnOneMeetingsSectionProps {
  personId: string
}

export async function OneOnOneMeetingsSection({
  personId,
}: OneOnOneMeetingsSectionProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizationId) {
    return null
  }

  // Get person with reports and manager info
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: session.user.organizationId,
    },
    include: {
      reports: true,
      manager: true,
    },
  })

  if (!person) {
    return null
  }

  // Get 1:1 meetings as manager
  const oneOnOnesAsManager = await prisma.oneOnOne.findMany({
    where: {
      managerId: personId,
    },
    include: {
      report: true,
    },
    orderBy: { scheduledAt: 'desc' },
  })

  // Get 1:1 meetings as report
  const oneOnOnes = await prisma.oneOnOne.findMany({
    where: {
      reportId: personId,
    },
    include: {
      manager: true,
    },
    orderBy: { scheduledAt: 'desc' },
  })

  // Only show if person has reports or a manager AND has 1:1s
  if (
    (person.reports.length === 0 && !person.manager) ||
    (oneOnOnes.length === 0 && oneOnOnesAsManager.length === 0)
  ) {
    return null
  }

  return (
    <section>
      <SectionHeader icon={MessageCircle} title='1:1 Meetings' />
      <div className='space-y-3'>
        {/* As Manager */}
        {oneOnOnesAsManager.length > 0 && (
          <div>
            <div className='text-sm font-medium mb-2'>
              As Manager ({oneOnOnesAsManager.length})
            </div>
            {oneOnOnesAsManager.slice(0, 2).map(oneOnOne => (
              <div key={oneOnOne.id} className='border rounded-xl p-3 mb-2'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Link
                      href={`/people/${oneOnOne.report.id}`}
                      className='font-medium hover:text-primary transition-colors'
                    >
                      {oneOnOne.report.name}
                    </Link>
                    <div className='text-xs text-muted-foreground mt-1'>
                      {oneOnOne.scheduledAt
                        ? new Date(oneOnOne.scheduledAt).toLocaleDateString()
                        : 'TBD'}
                    </div>
                  </div>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/oneonones/${oneOnOne.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* As Report */}
        {oneOnOnes.length > 0 && (
          <div>
            <div className='text-sm font-medium mb-2'>
              1:1 Meetings ({oneOnOnes.length})
            </div>
            {oneOnOnes.slice(0, 2).map(oneOnOne => (
              <div key={oneOnOne.id} className='border rounded-xl p-3 mb-2'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Link
                      href={`/people/${oneOnOne.manager.id}`}
                      className='font-medium hover:text-primary transition-colors'
                    >
                      {oneOnOne.manager.name}
                    </Link>
                    <div className='text-xs text-muted-foreground mt-1'>
                      {oneOnOne.scheduledAt
                        ? new Date(oneOnOne.scheduledAt).toLocaleDateString()
                        : 'TBD'}
                    </div>
                  </div>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/oneonones/${oneOnOne.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
