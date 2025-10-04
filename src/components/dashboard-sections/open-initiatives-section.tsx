import { prisma } from '@/lib/db'
import { DashboardInitiativesTable } from '@/components/initiatives/dashboard-initiatives-table'
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
      objectives: {
        select: {
          id: true,
          title: true,
          keyResult: true,
          sortIndex: true,
        },
      },
      owners: {
        include: {
          person: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      tasks: {
        select: {
          status: true,
        },
      },
      _count: {
        select: {
          checkIns: true,
          tasks: true,
        },
      },
    },
  })

  // Get people and teams for the table
  const [people, teams] = await Promise.all([
    prisma.person.findMany({
      where: { organizationId },
    }),
    prisma.team.findMany({
      where: { organizationId },
    }),
  ])

  if (!openInitiatives || openInitiatives.length === 0) return null

  return (
    <ExpandableSection
      title='Open Initiatives'
      icon='Rocket'
      viewAllHref='/initiatives'
    >
      <DashboardInitiativesTable
        initiatives={openInitiatives}
        people={people}
        teams={teams}
      />
    </ExpandableSection>
  )
}
