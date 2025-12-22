'use client'

import { GenericDataTable } from '@/components/common/generic-data-table'
import { peopleDataTableConfig } from './data-table-config'

interface PeopleDataTableProps {
  onPersonUpdate?: () => void
  hideFilters?: boolean
  settingsId?: string
  page?: number
  limit?: number
  enablePagination?: boolean
  immutableFilters?: {
    search?: string
    teamId?: string
    managerId?: string
    jobRoleId?: string
    status?: string
    currentPersonId?: string | null
  }
}

export function PeopleDataTable(props: PeopleDataTableProps) {
  return <GenericDataTable config={peopleDataTableConfig} {...props} />
}
