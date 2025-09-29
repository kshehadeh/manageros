import { InitiativeQuickTaskForm } from '@/components/initiative-quick-task-form'
import { TaskTable } from '@/components/task-table'
import { Task, Person, Initiative, Objective, User } from '@prisma/client'
import { ListTodo } from 'lucide-react'

type TaskWithRelations = Task & {
  assignee: Person | null
  initiative: Initiative | null
  objective: Objective | null
  createdBy: User | null
}

interface InitiativeTasksProps {
  initiativeId: string
  objectives: Array<{
    id: string
    title: string
    keyResult: string | null
    sortIndex: number
  }>
  allTasks: TaskWithRelations[]
  people: Person[]
}

export function InitiativeTasks({
  initiativeId,
  objectives,
  allTasks,
  people,
}: InitiativeTasksProps) {
  return (
    <div className='page-section'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='section-header font-bold flex items-center gap-2'>
          <ListTodo className='w-4 h-4' />
          Tasks
        </h3>
      </div>

      <div className='mb-4'>
        <InitiativeQuickTaskForm
          initiativeId={initiativeId}
          objectives={objectives.map(obj => ({
            ...obj,
            initiativeId,
          }))}
        />
      </div>

      <TaskTable
        tasks={allTasks}
        people={people}
        showInitiative={false}
        showDueDate={true}
        hideFilters={true}
      />
    </div>
  )
}
