import {
  SimpleOneOnOneList,
  type OneOnOne,
} from '@/components/oneonones/oneonone-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { Handshake, Eye } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { getPersonWithReportsAndManager } from '@/lib/data/people'
import { getOneOnOnesForPerson } from '@/lib/data/one-on-ones'

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
  const person = await getPersonWithReportsAndManager(personId, organizationId)

  if (!person) {
    return null
  }

  // Get 1:1 meetings where person is involved (as manager or report)
  const oneOnOnesResult = await getOneOnOnesForPerson(
    personId,
    organizationId,
    {
      limit: 5,
      includeManager: true,
      includeReport: true,
    }
  )

  // Type assertion: when includeManager and includeReport are true, they will be included
  const oneOnOnes = oneOnOnesResult as Array<
    (typeof oneOnOnesResult)[0] & {
      manager: { id: string; name: string; email: string } | null
      report: { id: string; name: string; email: string } | null
    }
  >

  // Only show if person has reports or a manager AND has 1:1s
  if (
    (person.reports.length === 0 && !person.manager) ||
    oneOnOnes.length === 0
  ) {
    return null
  }

  // Transform the data to match the OneOnOne interface
  const transformedOneOnOnes: OneOnOne[] = oneOnOnes
    .filter(ooo => ooo.manager && ooo.report)
    .map(oneOnOne => ({
      id: oneOnOne.id,
      managerId: oneOnOne.managerId,
      reportId: oneOnOne.reportId,
      scheduledAt: oneOnOne.scheduledAt,
      notes: oneOnOne.notes,
      manager: oneOnOne.manager!,
      report: oneOnOne.report!,
    }))

  return (
    <PageSection
      className='flex-1 min-w-[300px]'
      header={
        <SectionHeader
          icon={Handshake}
          title='1:1 Meetings'
          action={
            <Button asChild variant='default' size='sm'>
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
