import { InitiativeQuickTaskForm } from '@/components/initiatives/initiative-quick-task-form'
import { TaskTable } from '@/components/tasks/task-table'
import type { TaskListItem } from '@/lib/task-list-select'
import type { Person } from '@prisma/client'
import { ListTodo } from 'lucide-react'

interface InitiativeTasksProps {
  initiativeId: string
  objectives: Array<{
    id: string
    title: string
    keyResult: string | null
    sortIndex: number
  }>
  allTasks: TaskListItem[]
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
