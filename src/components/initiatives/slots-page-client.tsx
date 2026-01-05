'use client'

import { useState, useMemo } from 'react'
import { InitiativesSlotsView } from './initiatives-slots-view'
import {
  InitiativesSlotsFilters,
  type InitiativeSlotsFilters,
} from './initiatives-slots-filters'
import { ViewDropdown } from '@/components/common/view-dropdown'
import type { SlotInitiative } from './slot-card'

interface SlotsPageClientProps {
  slottedInitiatives: SlotInitiative[]
  unslottedInitiatives: SlotInitiative[]
  totalSlots: number
}

export function SlotsPageClient({
  slottedInitiatives,
  unslottedInitiatives,
  totalSlots,
}: SlotsPageClientProps) {
  const [filters, setFilters] = useState<InitiativeSlotsFilters>({
    teamIds: [],
    personIds: [],
  })

  const hasActiveFilters = useMemo(
    () => filters.teamIds.length > 0 || filters.personIds.length > 0,
    [filters]
  )

  const handleClearFilters = () => {
    setFilters({
      teamIds: [],
      personIds: [],
    })
  }

  return (
    <>
      <div className='flex items-center justify-end mb-4'>
        <ViewDropdown
          groupingValue='none'
          onGroupingChange={() => {}}
          groupingOptions={[]}
          sortField=''
          sortDirection='asc'
          onSortChange={() => {}}
          sortOptions={[]}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          filterContent={
            <InitiativesSlotsFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
          }
          title='Display'
        />
      </div>
      <InitiativesSlotsView
        slottedInitiatives={slottedInitiatives}
        unslottedInitiatives={unslottedInitiatives}
        totalSlots={totalSlots}
        filters={filters}
      />
    </>
  )
}
