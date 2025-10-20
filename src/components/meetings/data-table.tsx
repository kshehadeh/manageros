'use client'

import { GenericDataTable } from '@/components/common/generic-data-table'
import { meetingDataTableConfig } from '@/components/meetings/data-table-config'

interface MeetingDataTableProps {
  onMeetingUpdate?: () => void
  hideFilters?: boolean
  settingsId?: string
  page?: number
  limit?: number
  enablePagination?: boolean
  immutableFilters?: {
    search?: string
    teamId?: string
    organizerId?: string
    type?: string
    dateFrom?: string
    dateTo?: string
  }
}

export function MeetingDataTable(props: MeetingDataTableProps) {
  return <GenericDataTable config={meetingDataTableConfig} {...props} />
}
