'use client'

import { useSearchParams } from 'next/navigation'
import { PeopleDataTable } from '@/components/people/data-table'
import { PageSection } from '@/components/ui/page-section'

interface PeopleListClientProps {
  currentPersonId?: string | null
}

export function PeopleListClient({ currentPersonId }: PeopleListClientProps) {
  const searchParams = useSearchParams()
  const managerIdFromUrl = searchParams.get('managerId')

  // If managerId is in URL and matches current person, set it as immutable filter
  const immutableFilters: {
    managerId?: string
    currentPersonId?: string | null
  } = {}

  if (managerIdFromUrl && managerIdFromUrl === currentPersonId) {
    immutableFilters.managerId = managerIdFromUrl
  }

  if (currentPersonId) {
    immutableFilters.currentPersonId = currentPersonId
  }

  return (
    <PageSection className='-mx-3 md:mx-0'>
      <PeopleDataTable
        enablePagination={true}
        limit={100}
        immutableFilters={
          Object.keys(immutableFilters).length > 0
            ? immutableFilters
            : undefined
        }
      />
    </PageSection>
  )
}
