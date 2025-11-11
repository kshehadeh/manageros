import { InitiativeSidebar } from './initiative-sidebar'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
import { getPeopleForOrganization } from '@/lib/actions/person'
import { getTeams } from '@/lib/actions/team'
import { getEntityLinks } from '@/lib/actions/entity-links'
import { prisma } from '@/lib/db'

interface InitiativeSidebarServerProps {
  initiativeId: string
}

export async function InitiativeSidebarServer({
  initiativeId,
}: InitiativeSidebarServerProps) {
  const user = await getCurrentUser()
  const canEdit = await getActionPermission(
    user,
    'initiative.edit',
    initiativeId
  )

  // Fetch all necessary data for the sidebar
  const [initiative, people, teams, entityLinks] = await Promise.all([
    prisma.initiative.findUnique({
      where: { id: initiativeId },
      include: {
        team: { select: { id: true, name: true, avatar: true } },
        owners: {
          include: {
            person: {
              include: {
                team: true,
                jobRole: {
                  include: {
                    level: true,
                    domain: true,
                  },
                },
                manager: {
                  include: {
                    reports: true,
                  },
                },
                reports: true,
              },
            },
          },
        },
      },
    }),
    getPeopleForOrganization(),
    getTeams(),
    getEntityLinks('Initiative', initiativeId),
  ])

  if (!initiative) {
    return null
  }

  return (
    <InitiativeSidebar
      team={initiative.team}
      owners={initiative.owners}
      links={entityLinks}
      entityType='Initiative'
      entityId={initiativeId}
      teams={teams}
      people={people}
      canEdit={canEdit}
    />
  )
}
