'use client'

import { GenericDataTable } from '@/components/common/generic-data-table'
import { jobRolesDataTableConfig } from './job-roles-data-table-config'

interface JobRolesDataTableProps {
  onJobRoleUpdate?: () => void
  hideFilters?: boolean
  settingsId?: string
  page?: number
  limit?: number
  enablePagination?: boolean
  immutableFilters?: {
    search?: string
    levelId?: string
    domainId?: string
  }
}

export function JobRolesDataTable(props: JobRolesDataTableProps) {
  return <GenericDataTable config={jobRolesDataTableConfig} {...props} />
}
