import { SimpleTaskList, type Task } from '@/components/tasks/task-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { ListTodo } from 'lucide-react'
import { getTasksForAssignee } from '@/lib/data/tasks'
import { getCurrentUser } from '@/lib/auth-utils'
import { EmptyStateCard } from './empty-state-card'
import { checkIfManagerOrSelf } from '@/lib/utils/people-utils'

interface ActiveTasksSectionProps {
  personId: string
  organizationId: string
  currentPersonId?: string | null
}

export async function ActiveTasksSection({
  personId,
  organizationId,
  currentPersonId,
}: ActiveTasksSectionProps) {
  if (!organizationId) {
    return null
  }

  try {
    const user = await getCurrentUser()

    // Get active tasks for this person
    const tasksResult = await getTasksForAssignee(
      personId,
      organizationId,
      user.managerOSUserId || '',
      {
        statusFilter: ['todo', 'in_progress'],
        include: {
          assignee: true,
          initiative: true,
          objective: true,
          createdBy: true,
        },
      }
    )

    // Type assertion: when include options are true, relations will be included
    const tasks = tasksResult as Array<
      (typeof tasksResult)[0] & {
        assignee: { id: string; name: string } | null
        initiative: { id: string; title: string } | null
        objective: { id: string; title: string } | null
        createdBy: { id: string; name: string } | null
      }
    >

    // Show empty state card if person has no active tasks
    // Only show if current user is a manager (direct or indirect) of this person
    if (tasks.length === 0) {
      // Check if current user is a manager of this person
      const isManager =
        currentPersonId && currentPersonId !== personId
          ? await checkIfManagerOrSelf(currentPersonId, personId)
          : false

      // Only show empty state if user is a manager (not self)
      if (isManager && currentPersonId !== personId) {
        return (
          <EmptyStateCard
            title='Start with a Task'
            description='Create a task to help track work and progress. Tasks can be assigned to initiatives, have due dates, and be prioritized.'
            actionLabel='Create Task'
            actionHref={`/tasks/new?assigneeId=${personId}`}
            icon={ListTodo}
          />
        )
      }

      // If not a manager, return null (don't show empty state)
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
      <PageSection
        className='flex-1 min-w-[300px] '
        header={<SectionHeader icon={ListTodo} title='Active Tasks' />}
      >
        <SimpleTaskList
          tasks={transformedTasks}
          variant='compact'
          emptyStateText='No active tasks found.'
        />
      </PageSection>
    )
  } catch {
    return null
  }
}
