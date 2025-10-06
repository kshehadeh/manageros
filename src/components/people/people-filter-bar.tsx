'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter, X } from 'lucide-react'
import { getTeams } from '@/lib/actions/team'
import { getPeople } from '@/lib/actions/person'
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

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

  // Handle clicking outside to close filter popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        // Check if the click is on a Select dropdown (which renders outside the popup)
        const target = event.target as Element
        if (
          target.closest('[data-radix-popper-content-wrapper]') ||
          target.closest('[data-radix-select-content]') ||
          target.closest('[role="listbox"]')
        ) {
          return // Don't close if clicking on Select dropdown
        }
        setShowAdvancedFilters(false)
      }
    }

    if (showAdvancedFilters) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAdvancedFilters])

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
    <div className='space-y-4 px-0'>
      {/* Search and Filter Bar */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            placeholder='Search people...'
            value={textFilter}
            onChange={e => setTextFilter(e.target.value)}
            className='pl-10'
          />
        </div>

        <div className='relative' ref={filterRef}>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className='flex items-center gap-2'
          >
            <Filter className='h-4 w-4' />
            Filters
            {hasActiveFilters && (
              <div className='h-2 w-2 bg-primary rounded-full' />
            )}
          </Button>

          {/* Filter Popup */}
          {showAdvancedFilters && (
            <div className='absolute top-full left-0 mt-1 w-96 bg-background border rounded-lg shadow-lg p-4 z-50'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Team</label>
                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder='All teams' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All teams</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Manager</label>
                  <Select
                    value={managerFilter}
                    onValueChange={setManagerFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All managers' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All managers</SelectItem>
                      {managers.map(manager => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <Button variant='ghost' size='sm' onClick={clearFilters}>
            <X className='h-4 w-4 mr-1' />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
