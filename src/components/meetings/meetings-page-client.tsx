'use client'

import { MeetingDataTable } from '@/components/meetings/data-table'
import { PageSection } from '@/components/ui/page-section'

export function MeetingsPageClient() {
  return (
    <PageSection>
      <MeetingDataTable
        settingsId='meetings-list'
        enablePagination={true}
        limit={20}
      />
    </PageSection>
  )
}
