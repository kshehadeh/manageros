import { InitiativeQuickTaskForm } from '@/components/initiatives/initiative-quick-task-form'
import { TaskTable } from '@/components/tasks/task-table'
import { SectionHeader } from '@/components/ui/section-header'
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
      <SectionHeader icon={ListTodo} title='Tasks' className='mb-4' />

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
