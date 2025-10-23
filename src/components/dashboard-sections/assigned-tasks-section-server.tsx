import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { getTaskAccessWhereClause } from '@/lib/task-access-utils'
import { TASK_STATUS } from '@/lib/task-status'
import { DashboardAssignedTasksClientSection } from './assigned-tasks-section-client'

interface DashboardAssignedTasksServerSectionProps {
  personId: string
}

export async function DashboardAssignedTasksServerSection({
  personId,
}: DashboardAssignedTasksServerSectionProps) {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    return null
  }

  // Fetch tasks assigned to the current user that are not done
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: personId,
      status: { not: TASK_STATUS.DONE },
      ...getTaskAccessWhereClause(user.organizationId, user.id, personId),
    },
    orderBy: [
      { dueDate: { sort: 'asc', nulls: 'last' } }, // Sort by due date ascending (least urgent first), nulls last
    ],
    include: {
      initiative: {
        select: {
          title: true,
        },
      },
    },
  })

  return <DashboardAssignedTasksClientSection tasks={tasks} />
}
