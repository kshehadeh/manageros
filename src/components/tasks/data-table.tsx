'use client'

import { GenericDataTable } from '@/components/common/generic-data-table'
import { taskDataTableConfig } from './data-table-config'

interface TaskDataTableProps {
  onTaskUpdate?: () => void
  hideFilters?: boolean
  settingsId?: string
  page?: number
  limit?: number
  enablePagination?: boolean
  visibleColumns?: string[]
  immutableFilters?: Record<string, unknown>
  onRowClick?: (_id: string, _extra?: unknown) => void
}

export function TaskDataTable(props: TaskDataTableProps) {
  return <GenericDataTable config={taskDataTableConfig} {...props} />
}
