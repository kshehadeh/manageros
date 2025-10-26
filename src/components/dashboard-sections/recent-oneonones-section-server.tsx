import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import {
  SimpleOneOnOneList,
  type OneOnOne,
} from '@/components/oneonones/oneonone-list'

interface DashboardRecentOneOnOnesServerSectionProps {
  personId: string | null
}

export async function DashboardRecentOneOnOnesServerSection({
  personId,
}: DashboardRecentOneOnOnesServerSectionProps) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    return (
      <SimpleOneOnOneList
        oneOnOnes={[]}
        title='Recent 1:1s'
        variant='compact'
        viewAllHref='/oneonones'
        emptyStateText='No 1-on-1s found.'
      />
    )
  }

  // If user doesn't have a linked person record, return empty state
  if (!personId) {
    return (
      <SimpleOneOnOneList
        oneOnOnes={[]}
        title='Recent 1:1s'
        variant='compact'
        viewAllHref='/oneonones'
        emptyStateText='Please link your account to a person record to see your 1-on-1s.'
      />
    )
  }

  // Fetch recent one-on-ones where current user is involved (as manager or report)
  const oneOnOnes = await prisma.oneOnOne.findMany({
    where: {
      OR: [{ managerId: personId }, { reportId: personId }],
    },
    orderBy: { scheduledAt: 'desc' },
    take: 10,
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
  })

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
    <SimpleOneOnOneList
      oneOnOnes={transformedOneOnOnes}
      title='Recent 1:1s'
      variant='compact'
      viewAllHref='/oneonones'
      emptyStateText='No recent 1-on-1s found.'
    />
  )
}
