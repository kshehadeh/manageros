import { SimpleTaskList, type Task } from '@/components/tasks/task-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { ListTodo, Eye } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { getTasksForAssignee } from '@/lib/data/tasks'
import { getCurrentUser } from '@/lib/auth-utils'

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
      <PageSection
        header={
          <SectionHeader
            icon={ListTodo}
            title='Active Tasks'
            action={
              <Button asChild variant='outline' size='sm'>
                <Link href='/my-tasks' className='flex items-center gap-2'>
                  <Eye className='w-4 h-4' />
                  View All
                </Link>
              </Button>
            }
          />
        }
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
