import { prisma } from '@/lib/db'
import { SimpleTaskList, type Task } from '@/components/tasks/task-list'

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
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
        },
      },
      initiative: {
        select: {
          id: true,
          title: true,
        },
      },
      objective: {
        select: {
          id: true,
          title: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Only show if person has active tasks
  if (tasks.length === 0) {
    return null
  }

  // Transform the data to match the Task interface
  const transformedTasks: Task[] = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    assigneeId: task.assigneeId,
    assignee: task.assignee,
    dueDate: task.dueDate,
    priority: task.priority,
    status: task.status,
    initiative: task.initiative,
    objective: task.objective,
    createdBy: task.createdBy,
  }))

  return (
    <SimpleTaskList
      tasks={transformedTasks}
      title='Active Tasks'
      variant='compact'
      viewAllHref='/my-tasks'
      emptyStateText='No active tasks found.'
    />
  )
}
