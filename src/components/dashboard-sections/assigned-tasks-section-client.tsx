'use client'

import { useRouter } from 'next/navigation'
import { SimpleTaskList, type Task } from '@/components/tasks/task-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { ListTodo, Eye } from 'lucide-react'
import { Link } from '@/components/ui/link'

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
            <Button asChild variant='outline' size='sm'>
              <Link href='/my-tasks' className='flex items-center gap-2'>
                <Eye className='w-4 h-4' />
                My Tasks
              </Link>
            </Button>
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
