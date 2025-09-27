import { prisma } from '@/lib/db'
import { DirectReports } from '@/components/dashboard-direct-reports'
import { ExpandableSection } from '@/components/expandable-section'

interface DashboardDirectReportsSectionProps {
  userId: string
  organizationId: string
}

export async function DashboardDirectReportsSection({
  userId,
  organizationId,
}: DashboardDirectReportsSectionProps) {
  const directReports = await prisma.person.findMany({
    where: {
      organizationId,
      manager: { user: { id: userId } },
    },
    orderBy: { name: 'asc' },
    include: { team: true, reports: true },
  })

  if (!directReports || directReports.length === 0) return null

  return (
    <ExpandableSection title='Direct Reports' viewAllHref='/direct-reports'>
      <DirectReports directReports={directReports} />
    </ExpandableSection>
  )
}

