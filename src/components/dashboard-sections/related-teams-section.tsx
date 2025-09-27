import Link from 'next/link'
import { prisma } from '@/lib/db'
import { ExpandableSection } from '@/components/expandable-section'

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
    <ExpandableSection title='Related Teams' viewAllHref='/teams'>
      {teams.map(team => (
        <div key={team.id} className='flex items-center justify-between'>
          <div>
            <Link href={`/teams/${team.id}`} className='font-medium hover:text-blue-400'>
              {team.name}
            </Link>
            <div className='text-neutral-400 text-sm'>
              {team.description ?? ''}
            </div>
            <div className='text-xs text-neutral-500 mt-1'>
              {team.people.length} member{team.people.length !== 1 ? 's' : ''} • {team.initiatives.length} initiative{team.initiatives.length !== 1 ? 's' : ''}
              {team.parent && (
                <span>
                  {' '}• Parent:{' '}
                  <Link href={`/teams/${team.parent.id}`} className='hover:text-blue-400'>
                    {team.parent.name}
                  </Link>
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </ExpandableSection>
  )
}

