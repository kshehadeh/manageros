import { InitiativeTasksClient } from './initiative-tasks'
import { getTasksForInitiative } from '@/lib/actions/task'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
import type { Task } from '@/components/tasks/task-list'

interface InitiativeTasksProps {
  initiativeId: string
}

export async function InitiativeTasks({ initiativeId }: InitiativeTasksProps) {
  const user = await getCurrentUser()
  const canEdit = await getActionPermission(
    user,
    'initiative.edit',
    initiativeId
  )

  // Fetch tasks for this initiative
  const tasks = await getTasksForInitiative(initiativeId)

  // Only show if there are tasks
  if (tasks.length === 0) {
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
      canEdit={canEdit}
    />
  )
}
