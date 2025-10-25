'use client'

import { TaskDataTable } from './data-table'

interface MyTasksPageClientProps {
  personId: string | null
}

export function MyTasksPageClient({ personId }: MyTasksPageClientProps) {
  // If user doesn't have a linked person record, show empty state
  if (!personId) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground'>
          Please link your account to a person record to see your tasks.
        </p>
      </div>
    )
  }

  return (
    <TaskDataTable
      hideFilters={false}
      settingsId={'my-tasks'}
      immutableFilters={{
        assigneeId: personId,
      }}
      enablePagination={true}
      limit={50}
    />
  )
}
