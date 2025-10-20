'use client'

import { GenericDataTable } from '@/components/common/generic-data-table'
import { oneOnOneDataTableConfig } from '@/components/oneonones/data-table-config'

interface OneOnOneDataTableProps {
  onOneOnOneUpdate?: () => void
  hideFilters?: boolean
  settingsId?: string
  page?: number
  limit?: number
  enablePagination?: boolean
  immutableFilters?: {
    search?: string
    managerId?: string
    reportId?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }
}

export function OneOnOneDataTable(props: OneOnOneDataTableProps) {
  return <GenericDataTable config={oneOnOneDataTableConfig} {...props} />
}
