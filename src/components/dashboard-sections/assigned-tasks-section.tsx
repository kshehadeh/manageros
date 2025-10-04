import { prisma } from '@/lib/db'
import { AssignedTasks } from '@/components/tasks/dashboard-assigned-tasks'
import { ExpandableSection } from '@/components/expandable-section'
import { getTasksAssignedToCurrentUser } from '@/lib/actions/task'

interface DashboardAssignedTasksSectionProps {
  organizationId: string
}

export async function DashboardAssignedTasksSection({
  organizationId,
}: DashboardAssignedTasksSectionProps) {
  const [assignedTasks, people] = await Promise.all([
    getTasksAssignedToCurrentUser(),
    prisma.person.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!assignedTasks || assignedTasks.length === 0) return null

  return (
    <ExpandableSection title='My Tasks' icon='ListTodo' viewAllHref='/tasks'>
      <AssignedTasks assignedTasks={assignedTasks} people={people} />
    </ExpandableSection>
  )
}
