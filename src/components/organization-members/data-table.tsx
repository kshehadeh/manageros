'use client'

import { GenericDataTable } from '@/components/common/generic-data-table'
import { organizationMembersDataTableConfig } from './data-table-config'

interface OrganizationMembersDataTableProps {
  hideFilters?: boolean
  hideHeaders?: boolean
  settingsId?: string
  visibleColumns?: string[]
  immutableFilters?: Record<string, unknown>
  currentUserId?: string
}

export function OrganizationMembersDataTable({
  hideHeaders = true,
  ...props
}: OrganizationMembersDataTableProps) {
  return (
    <GenericDataTable
      config={organizationMembersDataTableConfig}
      hideHeaders={hideHeaders}
      {...props}
    />
  )
}
