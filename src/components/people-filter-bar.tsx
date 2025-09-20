'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { getTeams, getPeople } from '@/lib/actions'
import { Person } from '@/types/person'

interface PeopleFilterBarProps {
  people: Person[]
  onFilteredPeopleChange: (_filteredPeople: Person[]) => void
}

export function PeopleFilterBar({
  people,
  onFilteredPeopleChange,
}: PeopleFilterBarProps) {
  const [textFilter, setTextFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [managerFilter, setManagerFilter] = useState<string>('all')
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [managers, setManagers] = useState<Array<{ id: string; name: string }>>(
    []
  )

  // Load teams and managers for filter dropdowns
  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsData, peopleData] = await Promise.all([
          getTeams(),
          getPeople(),
        ])
        setTeams(teamsData)
        // Get unique managers from people data
        const uniqueManagers = peopleData
          .filter(person => person.name) // Only include people with names
          .map(person => ({ id: person.id, name: person.name }))
        setManagers(uniqueManagers)
      } catch (error) {
        console.error('Failed to load filter data:', error)
      }
    }
    loadData()
  }, [])

  // Apply filters whenever filter values change
  useEffect(() => {
    let filtered = [...people]

    // Text filter - search in name, role, email
    if (textFilter.trim()) {
      const searchTerm = textFilter.toLowerCase().trim()
      filtered = filtered.filter(person => {
        const name = person.name?.toLowerCase() || ''
        const role = person.role?.toLowerCase() || ''
        const email = person.email?.toLowerCase() || ''
        const teamName = person.team?.name?.toLowerCase() || ''
        const managerName = person.manager?.name?.toLowerCase() || ''

        return (
          name.includes(searchTerm) ||
          role.includes(searchTerm) ||
          email.includes(searchTerm) ||
          teamName.includes(searchTerm) ||
          managerName.includes(searchTerm)
        )
      })
    }

    // Team filter
    if (teamFilter !== 'all') {
      filtered = filtered.filter(person => person.team?.id === teamFilter)
    }

    // Manager filter
    if (managerFilter !== 'all') {
      filtered = filtered.filter(person => person.manager?.id === managerFilter)
    }

    onFilteredPeopleChange(filtered)
  }, [people, textFilter, teamFilter, managerFilter, onFilteredPeopleChange])

  const clearFilters = () => {
    setTextFilter('')
    setTeamFilter('all')
    setManagerFilter('all')
  }

  const hasActiveFilters =
    textFilter.trim() || teamFilter !== 'all' || managerFilter !== 'all'

  return (
    <div className='flex flex-wrap items-center gap-3 p-4 bg-card border rounded-lg'>
      {/* Text Search */}
      <div className='relative flex-1 min-w-[200px]'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          placeholder='Search people, roles, emails...'
          value={textFilter}
          onChange={e => setTextFilter(e.target.value)}
          className='pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground'
        />
      </div>

      {/* Team Filter */}
      <Select value={teamFilter} onValueChange={setTeamFilter}>
        <SelectTrigger className='w-[180px] bg-background border-input text-foreground'>
          <SelectValue placeholder='Filter by team' />
        </SelectTrigger>
        <SelectContent className='bg-popover text-popover-foreground border'>
          <SelectItem
            value='all'
            className='hover:bg-accent hover:text-accent-foreground'
          >
            All Teams
          </SelectItem>
          {teams.map(team => (
            <SelectItem
              key={team.id}
              value={team.id}
              className='hover:bg-accent hover:text-accent-foreground'
            >
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Manager Filter */}
      <Select value={managerFilter} onValueChange={setManagerFilter}>
        <SelectTrigger className='w-[180px] bg-background border-input text-foreground'>
          <SelectValue placeholder='Filter by manager' />
        </SelectTrigger>
        <SelectContent className='bg-popover text-popover-foreground border'>
          <SelectItem
            value='all'
            className='hover:bg-accent hover:text-accent-foreground'
          >
            All Managers
          </SelectItem>
          {managers.map(manager => (
            <SelectItem
              key={manager.id}
              value={manager.id}
              className='hover:bg-accent hover:text-accent-foreground'
            >
              {manager.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant='outline'
          size='sm'
          onClick={clearFilters}
          className='flex items-center gap-2'
        >
          <X className='w-4 h-4' />
          Clear
        </Button>
      )}
    </div>
  )
}
