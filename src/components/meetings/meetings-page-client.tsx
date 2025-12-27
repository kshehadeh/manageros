'use client'

import { MeetingDataTable } from '@/components/meetings/data-table'
import { PageSection } from '@/components/ui/page-section'

export function MeetingsPageClient() {
  return (
    <PageSection>
      <MeetingDataTable
        settingsId='default'
        enablePagination={true}
        limit={20}
      />
    </PageSection>
  )
}
