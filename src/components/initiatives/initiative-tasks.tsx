'use client'

import { useState, useRef } from 'react'
import { TaskDataTable } from '@/components/tasks/data-table'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  QuickTaskForm,
  type QuickTaskFormRef,
} from '@/components/tasks/quick-task-form'
import type { TaskListItem } from '@/lib/task-list-select'
import type { Person } from '@prisma/client'
import { ListTodo, Plus } from 'lucide-react'

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
  allTasks,
  people,
}: InitiativeTasksProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const quickTaskFormRef = useRef<QuickTaskFormRef>(null)

  const handleTaskCreated = () => {
    setIsModalOpen(false)
    // The page will be revalidated by the server action
  }

  return (
    <div className='page-section'>
      <SectionHeader
        icon={ListTodo}
        title='Tasks'
        className='mb-4'
        action={
          <Button
            onClick={() => setIsModalOpen(true)}
            variant='outline'
            size='sm'
          >
            <Plus className='h-4 w-4 mr-2' />
            Add Task
          </Button>
        }
      />

      <TaskDataTable tasks={allTasks} people={people} hideFilters={true} />

      {/* Add Task Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task to Initiative</DialogTitle>
          </DialogHeader>
          <QuickTaskForm
            ref={quickTaskFormRef}
            onSuccess={handleTaskCreated}
            initiativeId={initiativeId}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
