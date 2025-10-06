import { prisma } from '@/lib/db'
import { SectionHeader } from '@/components/ui/section-header'
import { PersonListItem } from '@/components/people/person-list-item'
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
    },
    orderBy: { name: 'asc' },
  })

  // Only show if person has direct reports
  if (reports.length === 0) {
    return null
  }

  return (
    <section>
      <SectionHeader
        icon={Users}
        title={`Direct Reports (${reports.length})`}
      />
      <div className='space-y-3'>
        {reports.map(report => (
          <PersonListItem
            key={report.id}
            person={report}
            showRole={true}
            showTeam={true}
          />
        ))}
      </div>
    </section>
  )
}
