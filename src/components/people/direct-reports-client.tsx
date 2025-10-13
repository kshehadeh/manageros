'use client'

import { PeopleDataTable } from './data-table'

interface DirectReportsClientProps {
  managerId: string
}

export function DirectReportsClient({ managerId }: DirectReportsClientProps) {
  return (
    <PeopleDataTable
      hideFilters={false}
      settingsId='direct-reports'
      immutableFilters={{
        managerId,
        status: 'active',
      }}
      enablePagination={false}
      limit={100}
    />
  )
}
