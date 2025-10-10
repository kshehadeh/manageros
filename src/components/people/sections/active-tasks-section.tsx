import { prisma } from '@/lib/db'
import { TaskDataTable } from '@/components/tasks/data-table'
import { SectionHeader } from '@/components/ui/section-header'
import { ListTodo } from 'lucide-react'
import { getActivePeopleForOrganization } from '@/lib/data/people'
import { TASK_LIST_SELECT } from '@/lib/task-list-select'

interface ActiveTasksSectionProps {
  personId: string
  organizationId: string
}

export async function ActiveTasksSection({
  personId,
  organizationId,
}: ActiveTasksSectionProps) {
  if (!organizationId) {
    return null
  }

  // Get active tasks for this person
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: personId,
      status: {
        in: ['todo', 'in_progress'],
      },
    },
    select: TASK_LIST_SELECT,
    orderBy: { updatedAt: 'desc' },
  })

  // Only show if person has active tasks
  if (tasks.length === 0) {
    return null
  }

  // Get people data for TaskTable
  const people = await getActivePeopleForOrganization(organizationId)

  return (
    <section>
      <SectionHeader icon={ListTodo} title={`Active Tasks (${tasks.length})`} />
      <TaskDataTable tasks={tasks} people={people} hideFilters={true} />
    </section>
  )
}
