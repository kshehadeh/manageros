'use client'

import { GenericDataTable } from '@/components/common/generic-data-table'
import { initiativeDataTableConfig } from './data-table-config'

interface InitiativeDataTableProps {
  onInitiativeUpdate?: () => void
  hideFilters?: boolean
  hideHeaders?: boolean
  settingsId?: string
  page?: number
  limit?: number
  enablePagination?: boolean
  visibleColumns?: string[]
  immutableFilters?: {
    search?: string
    teamId?: string | string[]
    ownerId?: string | string[]
    rag?: string | string[]
    status?: string | string[]
    dateFrom?: string
    dateTo?: string
  }
}

export function InitiativeDataTable({
  hideHeaders = true,
  ...props
}: InitiativeDataTableProps) {
  return (
    <GenericDataTable
      config={initiativeDataTableConfig}
      hideHeaders={hideHeaders}
      {...props}
    />
  )
}
