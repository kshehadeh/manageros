import { getOptionalUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { getTaskAccessWhereClause } from '@/lib/task-access-utils'
import { DashboardAssignedTasksClientSection } from './assigned-tasks-section-client'

interface DashboardAssignedTasksServerSectionProps {
  personId: string | null
}

export async function DashboardAssignedTasksServerSection({
  personId,
}: DashboardAssignedTasksServerSectionProps) {
  const user = await getOptionalUser()

  // Check if user belongs to an organization
  if (!user || !user.organizationId) {
    return null
  }

  // If user doesn't have a linked person record, return null
  if (!personId) {
    return null
  }

  // Fetch tasks assigned to the current user (including completed ones)
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: personId,
      ...getTaskAccessWhereClause(user.organizationId, user.id, personId),
    },
    orderBy: [
      { status: 'asc' }, // Show incomplete tasks first
      { dueDate: { sort: 'asc', nulls: 'last' } }, // Then sort by due date ascending
    ],
    include: {
      initiative: {
        select: {
          title: true,
        },
      },
    },
  })

  return (
    <DashboardAssignedTasksClientSection tasks={tasks} personId={personId} />
  )
}
