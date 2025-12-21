'use client'

import { PeopleDataTable } from '@/components/people/data-table'
import { PageSection } from '@/components/ui/page-section'

export function PeopleListClient() {
  return (
    <PageSection className='-mx-3 md:mx-0'>
      <PeopleDataTable enablePagination={true} limit={100} />
    </PageSection>
  )
}
