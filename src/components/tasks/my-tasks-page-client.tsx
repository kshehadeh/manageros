'use client'

import { TaskDataTable } from './data-table'

interface MyTasksPageClientProps {
  personId: string
}

export function MyTasksPageClient({ personId }: MyTasksPageClientProps) {
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
