'use client'

import { useRouter } from 'next/navigation'
import { SimpleTaskList, type Task } from '@/components/tasks/task-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { SectionHeaderAction } from '@/components/ui/section-header-action'
import { ListTodo, Eye } from 'lucide-react'

interface DashboardAssignedTasksClientSectionProps {
  tasks: Task[]
  personId: string
}

export function DashboardAssignedTasksClientSection({
  tasks,
  personId,
}: DashboardAssignedTasksClientSectionProps) {
  const router = useRouter()

  const handleTaskUpdate = () => {
    // Refresh the server component data without a full page reload
    router.refresh()
  }

  return (
    <PageSection
      header={
        <SectionHeader
          icon={ListTodo}
          title='Assigned Tasks'
          action={
            <SectionHeaderAction href='/my-tasks'>
              <Eye className='w-3.5 h-3.5' />
              My Tasks
            </SectionHeaderAction>
          }
        />
      }
    >
      <SimpleTaskList
        tasks={tasks}
        variant='compact'
        emptyStateText='No active tasks assigned to you.'
        onTaskUpdate={handleTaskUpdate}
        immutableFilters={{
          assigneeId: personId,
          status: ['todo', 'doing', 'blocked'],
        }}
      />
    </PageSection>
  )
}
