import { prisma } from '@/lib/db'
import { SimplePeopleList } from '@/components/people/person-list'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Users } from 'lucide-react'

interface DirectReportsSectionProps {
  personId: string
  organizationId: string
}

export async function DirectReportsSection({
  personId,
  organizationId,
}: DirectReportsSectionProps) {
  if (!organizationId) {
    return null
  }

  // Get direct reports for this person (only active persons)
  const reports = await prisma.person.findMany({
    where: {
      managerId: personId,
      organizationId,
      status: 'active',
    },
    include: {
      team: true,
      jobRole: {
        include: {
          level: true,
          domain: true,
        },
      },
      reports: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          birthday: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Only show if person has direct reports
  if (reports.length === 0) {
    return null
  }

  return (
    <PageSection
      header={
        <SectionHeader
          icon={Users}
          title={`Direct Reports (${reports.length})`}
        />
      }
      className='flex-1 min-w-[300px]'
    >
      <SimplePeopleList
        people={reports.map(report => ({
          ...report,
          manager: null,
          level: 0,
        }))}
        variant='compact'
        showEmail={false}
        showRole={true}
        showTeam={true}
        showJobRole={false}
        showManager={false}
        showReportsCount={false}
        emptyStateText='No direct reports.'
      />
    </PageSection>
  )
}
