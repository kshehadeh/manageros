import { getCurrentUser } from '@/lib/auth-utils'
import {
  SimpleOneOnOneList,
  type OneOnOne,
} from '@/components/oneonones/oneonone-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { Handshake, Eye } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { getOneOnOnesForPerson } from '@/lib/data/one-on-ones'

interface DashboardRecentOneOnOnesServerSectionProps {
  personId: string | null
}

export async function DashboardRecentOneOnOnesServerSection({
  personId,
}: DashboardRecentOneOnOnesServerSectionProps) {
  try {
    const user = await getCurrentUser()

    // Check if user belongs to an organization
    if (!user.managerOSOrganizationId) {
      return (
        <PageSection
          header={
            <SectionHeader
              icon={Handshake}
              title='Recent 1:1s'
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
            oneOnOnes={[]}
            variant='compact'
            emptyStateText='No 1-on-1s found.'
          />
        </PageSection>
      )
    }

    // If user doesn't have a linked person record, return empty state
    if (!personId) {
      return (
        <PageSection
          header={
            <SectionHeader
              icon={Handshake}
              title='Recent 1:1s'
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
            oneOnOnes={[]}
            variant='compact'
            emptyStateText='Please link your account to a person record to see your 1-on-1s.'
          />
        </PageSection>
      )
    }

    // Fetch recent one-on-ones where current user is involved (as manager or report)
    const oneOnOnesResult = await getOneOnOnesForPerson(personId, {
      limit: 10,
      includeManager: true,
      includeReport: true,
    })

    // Type assertion: when includeManager and includeReport are true, they will be included
    const oneOnOnes = oneOnOnesResult as Array<
      (typeof oneOnOnesResult)[0] & {
        manager: { id: string; name: string; email: string } | null
        report: { id: string; name: string; email: string } | null
      }
    >

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
        header={
          <SectionHeader
            icon={Handshake}
            title='Recent 1:1s'
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
          emptyStateText='No recent 1-on-1s found.'
        />
      </PageSection>
    )
  } catch {
    return (
      <PageSection
        header={
          <SectionHeader
            icon={Handshake}
            title='Recent 1:1s'
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
          oneOnOnes={[]}
          variant='compact'
          emptyStateText='No 1-on-1s found.'
        />
      </PageSection>
    )
  }
}
