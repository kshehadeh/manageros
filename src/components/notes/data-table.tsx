'use client'

import { GenericDataTable } from '@/components/common/generic-data-table'
import { notesDataTableConfig } from './data-table-config'

interface NotesDataTableProps {
  hideFilters?: boolean
  limit?: number
  enablePagination?: boolean
  immutableFilters?: Record<string, unknown>
}

export function NotesDataTable({
  hideFilters = false,
  limit = 20,
  enablePagination = false,
  immutableFilters,
}: NotesDataTableProps) {
  return (
    <GenericDataTable
      config={notesDataTableConfig}
      hideFilters={hideFilters}
      limit={limit}
      enablePagination={enablePagination}
      settingsId='notes'
      immutableFilters={immutableFilters}
    />
  )
}
