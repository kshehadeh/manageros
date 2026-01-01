import { prisma } from '@/lib/db'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'
import { InitiativePropertiesSidebar } from './initiative-properties-sidebar'
import { getInitiativeTaskCompletionCounts } from '@/lib/actions/task'
import type { InitiativeStatus } from '@/lib/initiative-status'

interface InitiativePropertiesSidebarServerProps {
  initiativeId: string
}

export async function InitiativePropertiesSidebarServer({
  initiativeId,
}: InitiativePropertiesSidebarServerProps) {
  const user = await getCurrentUser()

  const [initiative, canEdit, taskCounts] = await Promise.all([
    prisma.initiative.findFirst({
      where: {
        id: initiativeId,
        organizationId: user.managerOSOrganizationId || '',
      },
      select: {
        id: true,
        status: true,
        rag: true,
        priority: true,
        size: true,
        slot: true,
        startDate: true,
        targetDate: true,
      },
    }),
    getActionPermission(user, 'initiative.edit', initiativeId),
    getInitiativeTaskCompletionCounts(initiativeId),
  ])

  if (!initiative) {
    return null
  }

  const progress =
    taskCounts.total === 0
      ? 0
      : Math.round((taskCounts.completed / taskCounts.total) * 100)

  return (
    <InitiativePropertiesSidebar
      initiativeId={initiative.id}
      status={initiative.status as InitiativeStatus}
      rag={initiative.rag}
      priority={initiative.priority}
      size={initiative.size}
      slot={initiative.slot}
      startDate={initiative.startDate}
      targetDate={initiative.targetDate}
      progress={progress}
      canEdit={canEdit}
    />
  )
}
