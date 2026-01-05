'use client'

import { useTeamsCache } from '@/hooks/use-organization-cache'
import { usePeopleForSelect } from '@/hooks/use-organization-cache'
import {
  MultiSelect,
  type MultiSelectOption,
} from '@/components/ui/multi-select'

export interface InitiativeSlotsFilters {
  teamIds: string[]
  personIds: string[]
}

interface InitiativesSlotsFiltersProps {
  filters: InitiativeSlotsFilters
  onFiltersChange: (filters: InitiativeSlotsFilters) => void
}

export function InitiativesSlotsFilters({
  filters,
  onFiltersChange,
}: InitiativesSlotsFiltersProps) {
  const { teams } = useTeamsCache()
  const { people } = usePeopleForSelect()

  const teamOptions: MultiSelectOption[] = teams.map(team => ({
    value: team.id,
    label: team.name,
  }))

  const personOptions: MultiSelectOption[] = people.map(person => ({
    value: person.id,
    label: person.name,
  }))

  const handleTeamFilterChange = (selected: string[]) => {
    onFiltersChange({
      ...filters,
      teamIds: selected,
    })
  }

  const handlePersonFilterChange = (selected: string[]) => {
    onFiltersChange({
      ...filters,
      personIds: selected,
    })
  }

  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Team</label>
        <MultiSelect
          options={teamOptions}
          selected={filters.teamIds}
          onChange={handleTeamFilterChange}
          placeholder='All teams'
        />
      </div>

      <div className='space-y-2'>
        <label className='text-sm font-medium'>Owner</label>
        <MultiSelect
          options={personOptions}
          selected={filters.personIds}
          onChange={handlePersonFilterChange}
          placeholder='All owners'
        />
      </div>
    </div>
  )
}
