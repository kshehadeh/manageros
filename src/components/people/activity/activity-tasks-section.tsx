import { SimpleTaskList, type Task } from '@/components/tasks/task-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { ListTodo, Eye } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import { getTasksForAssignee } from '@/lib/data/tasks'
import { getCurrentUser } from '@/lib/auth-utils'

interface ActivityTasksSectionProps {
  personId: string
  organizationId: string
  dateRangeFrom: string
  dateRangeTo: string
}

export async function ActivityTasksSection({
  personId,
  organizationId,
  dateRangeFrom,
  dateRangeTo,
}: ActivityTasksSectionProps) {
  const dateRange = {
    from: new Date(dateRangeFrom),
    to: new Date(dateRangeTo),
  }
  if (!organizationId) {
    return null
  }

  try {
    const user = await getCurrentUser()

    // Get tasks for this person within the date range
    // We'll filter by updatedAt to show tasks that were active during this period
    const tasksResult = await getTasksForAssignee(
      personId,
      organizationId,
      user.managerOSUserId || '',
      {
        include: {
          assignee: true,
          initiative: true,
          objective: true,
          createdBy: true,
        },
      }
    )

    // Filter tasks by date range (tasks updated or created within the range)
    const filteredTasks = tasksResult.filter(task => {
      const updatedAt = task.updatedAt ? new Date(task.updatedAt) : null
      const createdAt = task.createdAt ? new Date(task.createdAt) : null

      if (!updatedAt && !createdAt) return false

      const relevantDate = updatedAt || createdAt
      if (!relevantDate) return false

      return relevantDate >= dateRange.from && relevantDate <= dateRange.to
    })

    // Type assertion: when include options are true, relations will be included
    const tasks = filteredTasks as Array<
      (typeof filteredTasks)[0] & {
        assignee: { id: string; name: string } | null
        initiative: { id: string; title: string } | null
        objective: { id: string; title: string } | null
        createdBy: { id: string; name: string } | null
      }
    >

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
      <div className='flex-1 min-w-[400px]'>
        <PageSection
          header={
            <SectionHeader
              icon={ListTodo}
              title='Tasks'
              action={
                <Button asChild variant='outline' size='sm'>
                  <Link
                    href={`/people/${personId}`}
                    className='flex items-center gap-2'
                  >
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
            emptyStateText='No tasks found in this period.'
          />
        </PageSection>
      </div>
    )
  } catch {
    return (
      <div className='flex-1 min-w-[400px]'>
        <PageSection
          header={
            <SectionHeader
              icon={ListTodo}
              title='Tasks'
              action={
                <Button asChild variant='outline' size='sm'>
                  <Link
                    href={`/people/${personId}`}
                    className='flex items-center gap-2'
                  >
                    <Eye className='w-4 h-4' />
                    View All
                  </Link>
                </Button>
              }
            />
          }
        >
          <SimpleTaskList
            tasks={[]}
            variant='compact'
            emptyStateText='No tasks found in this period.'
          />
        </PageSection>
      </div>
    )
  }
}
