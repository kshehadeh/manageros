import { prisma } from '@/lib/db'
import { TaskDataTable } from '@/components/tasks/data-table'
import { SectionHeader } from '@/components/ui/section-header'
import { ListTodo } from 'lucide-react'

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

  // Get active task count for this person
  const taskCount = await prisma.task.count({
    where: {
      assigneeId: personId,
      status: {
        in: ['todo', 'in_progress'],
      },
    },
  })

  // Only show if person has active tasks
  if (taskCount === 0) {
    return null
  }

  return (
    <section>
      <SectionHeader icon={ListTodo} title={`Active Tasks (${taskCount})`} />
      <TaskDataTable
        hideFilters={true}
        immutableFilters={{
          assigneeId: personId,
          status: 'todo,in_progress',
        }}
      />
    </section>
  )
}
