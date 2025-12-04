'use client'

import { GenericDataTable } from '@/components/common/generic-data-table'
import { meetingDataTableConfig } from '@/components/meetings/data-table-config'

interface MeetingDataTableProps {
  onMeetingUpdate?: () => void
  hideFilters?: boolean
  hideHeaders?: boolean
  settingsId?: string
  page?: number
  limit?: number
  enablePagination?: boolean
  immutableFilters?: {
    search?: string
    teamId?: string | string[]
    organizerId?: string
    type?: string
    dateFrom?: string
    dateTo?: string
    initiativeId?: string | string[]
  }
}

export function MeetingDataTable({
  hideHeaders = true,
  ...props
}: MeetingDataTableProps) {
  return (
    <GenericDataTable
      config={meetingDataTableConfig}
      hideHeaders={hideHeaders}
      {...props}
    />
  )
}
