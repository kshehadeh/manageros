import { prisma } from '@/lib/db'
import { InitiativesTable } from '@/components/initiatives/initiatives-table'
import { SectionHeader } from '@/components/ui/section-header'
import { Rocket } from 'lucide-react'
import { getActivePeopleForOrganization } from '@/lib/data/people'

interface OwnedInitiativesSectionProps {
  personId: string
  organizationId: string
}

export async function OwnedInitiativesSection({
  personId,
  organizationId,
}: OwnedInitiativesSectionProps) {
  if (!organizationId) {
    return null
  }

  // Get initiatives owned by this person
  const initiativeOwners = await prisma.initiativeOwner.findMany({
    where: {
      personId,
    },
    include: {
      initiative: {
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
          _count: {
            select: {
              checkIns: true,
              tasks: true,
            },
          },
          tasks: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  })

  // Only show if person has initiatives
  if (initiativeOwners.length === 0) {
    return null
  }

  // Get people data for InitiativesTable
  const people = await getActivePeopleForOrganization(organizationId)

  // Get teams for the InitiativesTable component
  const teams = await prisma.team.findMany({
    where: {
      organizationId,
    },
    orderBy: { name: 'asc' },
  })

  return (
    <section>
      <SectionHeader
        icon={Rocket}
        title={`Owned Initiatives (${initiativeOwners.length})`}
      />
      <InitiativesTable
        initiatives={initiativeOwners.map(ownership => ({
          ...ownership.initiative,
          objectives: ownership.initiative.objectives || [],
          owners: ownership.initiative.owners || [],
          _count: ownership.initiative._count || {
            checkIns: 0,
            tasks: 0,
          },
          tasks: ownership.initiative.tasks || [],
        }))}
        people={people}
        teams={teams}
        hideFilters={true}
        hideActions={true}
      />
    </section>
  )
}
