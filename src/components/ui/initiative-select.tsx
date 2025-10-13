'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInitiatives } from '@/hooks/use-initiatives'
import {
  initiativeStatusUtils,
  type InitiativeStatus,
} from '@/lib/initiative-status'

interface Initiative {
  id: string
  title: string
  status: string
  team?: {
    id: string
    name: string
  } | null
}

interface InitiativeSelectProps {
  value?: string
  onValueChange?: (_value: string) => void
  placeholder?: string
  disabled?: boolean
  showStatus?: boolean // Optional: whether to show status (default: true)
  showTeam?: boolean // Optional: whether to show team name (default: false)
  includeNone?: boolean // Optional: whether to include "None" option (default: false)
  noneLabel?: string // Optional: label for "None" option (default: "No initiative")
  className?: string
  autoFocus?: boolean // Optional: whether to auto-open dropdown (default: false)
  statusFilter?: string // Optional: filter initiatives by status
}

export function InitiativeSelect({
  value,
  onValueChange,
  placeholder = 'Select an initiative...',
  disabled = false,
  showStatus = true,
  showTeam = false,
  includeNone = false,
  noneLabel = 'No initiative',
  className,
  autoFocus = false,
  statusFilter,
}: InitiativeSelectProps) {
  const { data, loading } = useInitiatives({
    limit: 1000, // Get all initiatives
    filters: statusFilter ? { status: statusFilter } : undefined,
  })
  const [selectOpen, setSelectOpen] = useState(false)

  const initiatives = data?.initiatives || []

  // Auto-open dropdown if requested
  useEffect(() => {
    if (autoFocus && !loading && initiatives.length > 0) {
      const timer = setTimeout(() => {
        setSelectOpen(true)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [autoFocus, loading, initiatives.length])

  const renderInitiativeItem = (initiative: Initiative) => (
    <div className='flex items-center justify-between gap-2 w-full'>
      <div className='text-left flex-1 min-w-0'>
        <div className='font-medium truncate'>{initiative.title}</div>
        {(showStatus || showTeam) && (
          <div className='text-xs text-muted-foreground truncate'>
            {showStatus &&
              initiativeStatusUtils.getLabel(
                initiative.status as InitiativeStatus
              )}
            {showStatus && showTeam && initiative.team && ' • '}
            {showTeam && initiative.team?.name}
          </div>
        )}
      </div>
    </div>
  )

  const renderInitiativeText = (initiative: Initiative) => {
    return initiative.title
  }

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || loading}
      open={selectOpen}
      onOpenChange={setSelectOpen}
    >
      <SelectTrigger className={className}>
        <SelectValue
          placeholder={loading ? 'Loading initiatives...' : placeholder}
        />
      </SelectTrigger>
      <SelectContent>
        {includeNone && <SelectItem value='none'>{noneLabel}</SelectItem>}
        {initiatives.map(initiative => (
          <SelectItem key={initiative.id} value={initiative.id}>
            {showStatus || showTeam
              ? renderInitiativeItem(initiative)
              : renderInitiativeText(initiative)}
          </SelectItem>
        ))}
        {!loading && initiatives.length === 0 && (
          <div className='py-6 text-center text-sm text-muted-foreground'>
            No initiatives found
          </div>
        )}
      </SelectContent>
    </Select>
  )
}
