'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from '@/components/ui/select'
import { useTeamsForSelect } from '@/hooks/use-organization-cache'

interface Team {
  id: string
  name: string
  parentId?: string | null
}

interface TeamSelectProps {
  value?: string
  onValueChange?: (_value: string) => void
  placeholder?: string
  disabled?: boolean
  includeNone?: boolean // Optional: whether to include "None" option (default: false)
  noneLabel?: string // Optional: label for "None" option (default: "No team")
  className?: string
  autoFocus?: boolean // Optional: whether to auto-open dropdown (default: false)
}

export function TeamSelect({
  value,
  onValueChange,
  placeholder = 'Select a team...',
  disabled = false,
  includeNone = false,
  noneLabel = 'No team',
  className,
  autoFocus = false,
}: TeamSelectProps) {
  const { teams, isLoading } = useTeamsForSelect()
  const [selectOpen, setSelectOpen] = useState(false)

  // Auto-open dropdown if requested
  useEffect(() => {
    if (autoFocus && !isLoading && teams.length > 0) {
      const timer = setTimeout(() => {
        setSelectOpen(true)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [autoFocus, isLoading, teams.length])

  const renderTeamText = (team: Team) => {
    return team.name
  }

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || isLoading}
      open={selectOpen}
      onOpenChange={setSelectOpen}
    >
      <SelectTrigger className={className}>
        <SelectValue
          placeholder={isLoading ? 'Loading teams...' : placeholder}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectScrollUpButton />
        {includeNone && <SelectItem value='none'>{noneLabel}</SelectItem>}
        {teams.map(team => (
          <SelectItem key={team.id} value={team.id}>
            {renderTeamText(team)}
          </SelectItem>
        ))}
        <SelectScrollDownButton />
      </SelectContent>
    </Select>
  )
}
