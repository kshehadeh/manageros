import { prisma } from '@/lib/db'
import { ExpandableSection } from '@/components/expandable-section'
import { TeamListItem } from '@/components/teams/team-list-item'

interface DashboardRelatedTeamsSectionProps {
  userId: string
  organizationId: string
}

async function getAllManagedPeople(userId: string) {
  const managedPersonIds: string[] = []

  const currentUserPerson = await prisma.person.findFirst({
    where: { user: { id: userId } },
    select: { id: true },
  })

  if (!currentUserPerson) return managedPersonIds

  const findReports = async (managerId: string) => {
    const directReports = await prisma.person.findMany({
      where: { managerId },
      select: { id: true },
    })

    for (const report of directReports) {
      managedPersonIds.push(report.id)
      await findReports(report.id)
    }
  }

  await findReports(currentUserPerson.id)
  return managedPersonIds
}

export async function DashboardRelatedTeamsSection({
  userId,
  organizationId,
}: DashboardRelatedTeamsSectionProps) {
  const managedPersonIds = await getAllManagedPeople(userId)

  const teams = await prisma.team.findMany({
    where: {
      organizationId,
      OR: [
        { people: { some: { user: { id: userId } } } },
        { people: { some: { id: { in: managedPersonIds } } } },
      ],
    },
    orderBy: { name: 'asc' },
    include: { people: true, initiatives: true, parent: true },
  })

  if (!teams || teams.length === 0) return null

  return (
    <ExpandableSection title='Related Teams' icon='Users2' viewAllHref='/teams'>
      {teams.map(team => (
        <TeamListItem key={team.id} team={team} />
      ))}
    </ExpandableSection>
  )
}
