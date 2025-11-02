import { prisma } from '@/lib/db'
import {
  SimpleOneOnOneList,
  type OneOnOne,
} from '@/components/oneonones/oneonone-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { Handshake, Eye } from 'lucide-react'
import Link from 'next/link'

interface OneOnOneMeetingsSectionProps {
  personId: string
  organizationId: string
}

export async function OneOnOneMeetingsSection({
  personId,
  organizationId,
}: OneOnOneMeetingsSectionProps) {
  if (!organizationId) {
    return null
  }

  // Get person with reports and manager info
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId,
    },
    include: {
      reports: true,
      manager: true,
    },
  })

  if (!person) {
    return null
  }

  // Get 1:1 meetings where person is involved (as manager or report)
  const oneOnOnes = await prisma.oneOnOne.findMany({
    where: {
      OR: [{ managerId: personId }, { reportId: personId }],
    },
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      report: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { scheduledAt: 'desc' },
    take: 5, // Limit to 5 for the preview
  })

  // Only show if person has reports or a manager AND has 1:1s
  if (
    (person.reports.length === 0 && !person.manager) ||
    oneOnOnes.length === 0
  ) {
    return null
  }

  // Transform the data to match the OneOnOne interface
  const transformedOneOnOnes: OneOnOne[] = oneOnOnes.map(oneOnOne => ({
    id: oneOnOne.id,
    managerId: oneOnOne.managerId,
    reportId: oneOnOne.reportId,
    scheduledAt: oneOnOne.scheduledAt,
    notes: oneOnOne.notes,
    manager: oneOnOne.manager,
    report: oneOnOne.report,
  }))

  return (
    <PageSection
      header={
        <SectionHeader
          icon={Handshake}
          title='1:1 Meetings'
          action={
            <Button asChild variant='outline' size='sm'>
              <Link href='/oneonones' className='flex items-center gap-2'>
                <Eye className='w-4 h-4' />
                View All
              </Link>
            </Button>
          }
        />
      }
    >
      <SimpleOneOnOneList
        oneOnOnes={transformedOneOnOnes}
        variant='compact'
        emptyStateText='No 1-on-1s found.'
      />
    </PageSection>
  )
}
