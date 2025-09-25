import { TaskTable } from '@/components/task-table'
import { Task, Person, User, Initiative, Objective } from '@prisma/client'

type TaskWithRelations = Task & {
  assignee: Person | null
  createdBy: User | null
  objective: Objective | null
  initiative: Initiative | null
}

interface AssignedTasksProps {
  assignedTasks: TaskWithRelations[]
  people: Person[]
}

export function AssignedTasks({ assignedTasks, people }: AssignedTasksProps) {
  if (assignedTasks.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground text-sm'>No assigned tasks</p>
      </div>
    )
  }

  return (
    <TaskTable
      tasks={assignedTasks}
      people={people}
      showInitiative={true}
      showDueDate={true}
    />
  )
}
