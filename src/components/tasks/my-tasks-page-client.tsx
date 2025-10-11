'use client'

import type { Initiative } from '@prisma/client'
import { TaskDataTable } from './data-table'

interface MyTasksPageClientProps {
  personId: string
  initiatives: Initiative[]
}

export function MyTasksPageClient({
  personId,
  initiatives,
}: MyTasksPageClientProps) {
  return (
    <TaskDataTable
      initiatives={initiatives}
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
