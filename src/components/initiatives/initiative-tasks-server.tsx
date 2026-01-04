import { InitiativeTasksClient } from './initiative-tasks'
import { getTasksForInitiative } from '@/lib/actions/task'
import type { Task } from '@/components/tasks/task-list'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'

interface InitiativeTasksProps {
  initiativeId: string
}

export async function InitiativeTasks({ initiativeId }: InitiativeTasksProps) {
  const user = await getCurrentUser()
  const canCreateTask = await getActionPermission(user, 'task.create')

  // Fetch tasks for this initiative
  const tasks = await getTasksForInitiative(initiativeId)

  // Show section if there are tasks or if user can create tasks
  // This allows users to add the first task from the section header
  if (tasks.length === 0 && !canCreateTask) {
    return null
  }

  // Transform tasks to match Task type
  const transformedTasks: Task[] = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    assigneeId: task.assigneeId,
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          name: task.assignee.name,
        }
      : null,
    dueDate: task.dueDate,
    priority: task.priority,
    status: task.status,
    initiative: task.initiative
      ? {
          id: task.initiative.id,
          title: task.initiative.title,
        }
      : null,
    objective: task.objective
      ? {
          id: task.objective.id,
          title: task.objective.title,
        }
      : null,
    createdBy: task.createdBy
      ? {
          id: task.createdBy.id,
          name: task.createdBy.name,
        }
      : null,
  }))

  return (
    <InitiativeTasksClient
      initiativeId={initiativeId}
      tasks={transformedTasks}
      canCreateTask={canCreateTask}
    />
  )
}
