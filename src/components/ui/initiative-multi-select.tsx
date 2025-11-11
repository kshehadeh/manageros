'use client'

import {
  MultiSelect,
  type MultiSelectOption,
} from '@/components/ui/multi-select'
import { useInitiatives } from '@/hooks/use-initiatives'
import {
  initiativeStatusUtils,
  type InitiativeStatus,
} from '@/lib/initiative-status'

interface InitiativeMultiSelectProps {
  selected: string[]
  onChange: (_selected: string[]) => void
  placeholder?: string
  showStatus?: boolean
  showTeam?: boolean
  statusFilter?: string
  className?: string
}

export function InitiativeMultiSelect({
  selected,
  onChange,
  placeholder = 'Select initiatives...',
  showStatus = true,
  showTeam = false,
  statusFilter,
  className,
}: InitiativeMultiSelectProps) {
  const { data, loading } = useInitiatives({
    limit: 1000,
    filters: statusFilter ? { status: statusFilter } : undefined,
  })

  const initiatives = data?.initiatives || []

  const options: MultiSelectOption[] = initiatives.map(initiative => {
    let label = initiative.title

    // Add status and/or team info if requested
    const additionalInfo: string[] = []
    if (showStatus) {
      additionalInfo.push(
        initiativeStatusUtils.getLabel(initiative.status as InitiativeStatus)
      )
    }
    if (showTeam && initiative.team) {
      additionalInfo.push(initiative.team.name)
    }

    if (additionalInfo.length > 0) {
      label = `${label} (${additionalInfo.join(' • ')})`
    }

    return {
      label,
      value: initiative.id,
    }
  })

  if (loading) {
    return (
      <div className='text-sm text-muted-foreground py-md'>
        Loading initiatives...
      </div>
    )
  }

  return (
    <MultiSelect
      options={options}
      selected={selected}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  )
}
