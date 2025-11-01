import { prisma } from '@/lib/db'
import { SimplePeopleList } from '@/components/people/person-list'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Users } from 'lucide-react'
import type { Person } from '@/types/person'

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

  // Transform reports to match Person type
  const formattedReports: Person[] = reports.map(report => ({
    id: report.id,
    name: report.name,
    email: report.email,
    role: report.role,
    status: report.status,
    birthday: report.birthday,
    avatar: report.avatar,
    employeeType: report.employeeType,
    team: report.team
      ? {
          id: report.team.id,
          name: report.team.name,
        }
      : null,
    jobRole: report.jobRole
      ? {
          id: report.jobRole.id,
          title: report.jobRole.title,
          level: {
            id: report.jobRole.level.id,
            name: report.jobRole.level.name,
          },
          domain: {
            id: report.jobRole.domain.id,
            name: report.jobRole.domain.name,
          },
        }
      : null,
    manager: null,
    reports: report.reports,
    level: 0,
  }))

  return (
    <PageSection
      header={
        <SectionHeader
          icon={Users}
          title={`Direct Reports (${reports.length})`}
        />
      }
    >
      <SimplePeopleList
        people={formattedReports}
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
