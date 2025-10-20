'use client'

import { GenericDataTable } from '@/components/common/generic-data-table'
import { teamDataTableConfig } from '@/components/teams/data-table-config'

interface TeamsDataTableProps {
  settingsId?: string
  page?: number
  limit?: number
  enablePagination?: boolean
}

export function TeamsDataTable(props: TeamsDataTableProps) {
  return <GenericDataTable config={teamDataTableConfig} {...props} />
}
