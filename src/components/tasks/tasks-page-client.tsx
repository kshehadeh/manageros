'use client'

import { TaskDataTable } from '@/components/tasks/data-table'

export function TasksPageClient() {
  return (
    <div className='space-y-4'>
      <TaskDataTable hideFilters={false} />
    </div>
  )
}
