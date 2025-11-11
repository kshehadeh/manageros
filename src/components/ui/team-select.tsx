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
import { TeamAvatar } from '@/components/teams/team-avatar'
import { useTeamsForSelect } from '@/hooks/use-organization-cache'

interface Team {
  id: string
  name: string
  parentId?: string | null
  avatar?: string | null
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
  excludeTeamIds?: string[] // Optional: team IDs to exclude from the list
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
  excludeTeamIds = [],
}: TeamSelectProps) {
  const { teams, isLoading } = useTeamsForSelect()
  const [selectOpen, setSelectOpen] = useState(false)

  // Filter out excluded teams
  const filteredTeams = teams.filter(team => !excludeTeamIds.includes(team.id))

  // Auto-open dropdown if requested
  useEffect(() => {
    if (autoFocus && !isLoading && filteredTeams.length > 0) {
      const timer = setTimeout(() => {
        setSelectOpen(true)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [autoFocus, isLoading, filteredTeams.length])

  const renderTeamOption = (team: Team) => {
    return (
      <div className='flex items-center gap-md'>
        <TeamAvatar name={team.name} avatar={team.avatar} size='xs' />
        <span>{team.name}</span>
      </div>
    )
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
        {filteredTeams.map(team => (
          <SelectItem key={team.id} value={team.id}>
            {renderTeamOption(team)}
          </SelectItem>
        ))}
        <SelectScrollDownButton />
      </SelectContent>
    </Select>
  )
}
