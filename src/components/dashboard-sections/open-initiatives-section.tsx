import { prisma } from '@/lib/db'
import { OpenInitiatives } from '@/components/dashboard-open-initiatives'
import { ExpandableSection } from '@/components/expandable-section'

interface DashboardOpenInitiativesSectionProps {
  organizationId: string
}

export async function DashboardOpenInitiativesSection({
  organizationId,
}: DashboardOpenInitiativesSectionProps) {
  const openInitiatives = await prisma.initiative.findMany({
    where: {
      organizationId,
      status: { notIn: ['done', 'canceled'] },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      team: true,
      objectives: true,
      _count: { select: { checkIns: true } },
    },
  })

  if (!openInitiatives || openInitiatives.length === 0) return null

  return (
    <ExpandableSection title='Open Initiatives' viewAllHref='/initiatives'>
      <OpenInitiatives openInitiatives={openInitiatives} />
    </ExpandableSection>
  )
}
