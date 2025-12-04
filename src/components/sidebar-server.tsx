import Sidebar from './sidebar'
import { getFilteredNavigation } from '@/lib/auth-utils'
import { getCurrentUserWithPersonAndOrganization } from '@/lib/auth-utils'
import { getIncompleteTasksCountForAssignee } from '@/lib/data/tasks'
import { prisma } from '@/lib/db'

export default async function SidebarServer() {
  const userWithPerson = await getCurrentUserWithPersonAndOrganization()
  const filteredNavigation = await getFilteredNavigation(userWithPerson.user)

  // Fetch badge counts for navigation items
  const navigationWithBadges = await Promise.all(
    filteredNavigation.map(async item => {
      // Add incomplete tasks count to "My Tasks"
      if (
        item.href === '/my-tasks' &&
        userWithPerson.person?.id &&
        userWithPerson.user.managerOSOrganizationId &&
        userWithPerson.user.managerOSUserId
      ) {
        const tasksInfo = await getIncompleteTasksCountForAssignee(
          userWithPerson.person.id,
          userWithPerson.user.managerOSOrganizationId,
          userWithPerson.user.managerOSUserId
        )
        return {
          ...item,
          badgeCount: tasksInfo.count,
          badgeVariant: (tasksInfo.hasOverdue ? 'error' : 'secondary') as
            | 'error'
            | 'secondary',
        }
      }

      // Add in progress initiatives count to "Initiatives"
      if (
        item.href === '/initiatives' &&
        userWithPerson.person?.id &&
        userWithPerson.user.managerOSOrganizationId
      ) {
        const inProgressInitiativesCount = await prisma.initiative.count({
          where: {
            organizationId: userWithPerson.user.managerOSOrganizationId,
            owners: {
              some: { personId: userWithPerson.person.id },
            },
            status: 'in_progress',
          },
        })
        return { ...item, badgeCount: inProgressInitiativesCount }
      }

      return item
    })
  )

  return (
    <Sidebar
      navigation={navigationWithBadges}
      serverSession={userWithPerson.user}
      personData={userWithPerson.person}
    />
  )
}
