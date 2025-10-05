'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Person, Team } from '@prisma/client'
import { InitiativeWithRelations } from '@/types/initiative'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

interface InitiativesFilterBarProps {
  initiatives: InitiativeWithRelations[]
  people: Person[]
  teams: Team[]
  onFilteredInitiativesChange: (
    _filteredInitiatives: InitiativeWithRelations[]
  ) => void
}

export function InitiativesFilterBar({
  initiatives,
  people,
  teams,
  onFilteredInitiativesChange,
}: InitiativesFilterBarProps) {
  const { getSetting, updateSetting, isLoaded } = useUserSettings()
  const [textFilter, setTextFilter] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [ragFilter, setRagFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // Load filter values from user settings
  useEffect(() => {
    if (isLoaded) {
      const savedFilters = getSetting('initiativeFilters')
      setTextFilter(savedFilters.textFilter)
      setOwnerFilter(savedFilters.ownerFilter)
      setTeamFilter(savedFilters.teamFilter)
      setRagFilter(savedFilters.ragFilter)
      setStatusFilter(savedFilters.statusFilter)
      setDateRangeFilter(savedFilters.dateRangeFilter)
      setStartDate(savedFilters.startDate)
      setEndDate(savedFilters.endDate)
    }
  }, [isLoaded, getSetting])

  // Helper function to save filter values to user settings
  const saveFilters = (filters: {
    textFilter: string
    ownerFilter: string
    teamFilter: string
    ragFilter: string
    statusFilter: string
    dateRangeFilter: string
    startDate: string
    endDate: string
  }) => {
    updateSetting('initiativeFilters', filters)
  }

  // Handle clicking outside to close filter popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
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
    let filtered = [...initiatives]

    // Text filter - search in title and summary
    if (textFilter.trim()) {
      const searchTerm = textFilter.toLowerCase().trim()
      filtered = filtered.filter(initiative => {
        const title = initiative.title?.toLowerCase() || ''
        const summary = initiative.summary?.toLowerCase() || ''
        const ownerNames = initiative.owners
          .map(o => o.person.name.toLowerCase())
          .join(' ')
        const teamName = initiative.team?.name?.toLowerCase() || ''

        return (
          title.includes(searchTerm) ||
          summary.includes(searchTerm) ||
          ownerNames.includes(searchTerm) ||
          teamName.includes(searchTerm)
        )
      })
    }

    // Owner filter
    if (ownerFilter !== 'all') {
      filtered = filtered.filter(initiative =>
        initiative.owners.some(owner => owner.personId === ownerFilter)
      )
    }

    // Team filter
    if (teamFilter !== 'all') {
      if (teamFilter === 'no-team') {
        filtered = filtered.filter(initiative => !initiative.teamId)
      } else {
        filtered = filtered.filter(
          initiative => initiative.teamId === teamFilter
        )
      }
    }

    // RAG filter
    if (ragFilter !== 'all') {
      filtered = filtered.filter(initiative => initiative.rag === ragFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        initiative => initiative.status === statusFilter
      )
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(initiative => {
        const initiativeDate =
          initiative.startDate || initiative.targetDate || initiative.createdAt

        switch (dateRangeFilter) {
          case 'today':
            const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            )
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
            return initiativeDate >= today && initiativeDate < tomorrow
          case 'this-week':
            const startOfWeek = new Date(now)
            startOfWeek.setDate(now.getDate() - now.getDay())
            startOfWeek.setHours(0, 0, 0, 0)
            return initiativeDate >= startOfWeek
          case 'this-month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            return initiativeDate >= startOfMonth
          case 'last-30-days':
            const thirtyDaysAgo = new Date(
              now.getTime() - 30 * 24 * 60 * 60 * 1000
            )
            return initiativeDate >= thirtyDaysAgo
          case 'custom':
            if (startDate) {
              const start = new Date(startDate)
              start.setHours(0, 0, 0, 0)
              if (initiativeDate < start) return false
            }
            if (endDate) {
              const end = new Date(endDate)
              end.setHours(23, 59, 59, 999)
              if (initiativeDate > end) return false
            }
            return true
          default:
            return true
        }
      })
    }

    onFilteredInitiativesChange(filtered)
  }, [
    initiatives,
    textFilter,
    ownerFilter,
    teamFilter,
    ragFilter,
    statusFilter,
    dateRangeFilter,
    startDate,
    endDate,
    onFilteredInitiativesChange,
  ])

  const clearAllFilters = () => {
    setTextFilter('')
    setOwnerFilter('all')
    setTeamFilter('all')
    setRagFilter('all')
    setStatusFilter('all')
    setDateRangeFilter('all')
    setStartDate('')
    setEndDate('')

    const clearedFilters = {
      textFilter: '',
      ownerFilter: 'all',
      teamFilter: 'all',
      ragFilter: 'all',
      statusFilter: 'all',
      dateRangeFilter: 'all',
      startDate: '',
      endDate: '',
    }
    saveFilters(clearedFilters)
  }

  const hasActiveFilters =
    textFilter.trim() !== '' ||
    ownerFilter !== 'all' ||
    teamFilter !== 'all' ||
    ragFilter !== 'all' ||
    statusFilter !== 'all' ||
    dateRangeFilter !== 'all'

  return (
    <div className='space-y-4'>
      {/* Main Filter Bar */}
      <div className='flex flex-col lg:flex-row gap-4 items-start lg:items-center'>
        {/* Search Input */}
        <div className='relative flex-1 min-w-0'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search initiatives...'
            value={textFilter}
            onChange={e => {
              setTextFilter(e.target.value)
              saveFilters({
                textFilter: e.target.value,
                ownerFilter,
                teamFilter,
                ragFilter,
                statusFilter,
                dateRangeFilter,
                startDate,
                endDate,
              })
            }}
            className='pl-10'
          />
        </div>

        {/* Advanced Filters Button */}
        <div className='relative' ref={filterRef}>
          <Button
            variant='outline'
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-2 ${
              hasActiveFilters ? 'border-primary bg-primary/5' : ''
            }`}
          >
            <Filter className='h-4 w-4' />
            Filters
            {hasActiveFilters && (
              <div className='h-2 w-2 bg-primary rounded-full' />
            )}
          </Button>

          {/* Advanced Filters Dropdown */}
          {showAdvancedFilters && (
            <div className='absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-lg p-4 z-50'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='font-medium'>Advanced Filters</h3>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowAdvancedFilters(false)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>

                {/* Owner Filter */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Owner</label>
                  <Select
                    value={ownerFilter}
                    onValueChange={value => {
                      setOwnerFilter(value)
                      saveFilters({
                        textFilter,
                        ownerFilter: value,
                        teamFilter,
                        ragFilter,
                        statusFilter,
                        dateRangeFilter,
                        startDate,
                        endDate,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All owners' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All owners</SelectItem>
                      {people.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Team Filter */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Team</label>
                  <Select
                    value={teamFilter}
                    onValueChange={value => {
                      setTeamFilter(value)
                      saveFilters({
                        textFilter,
                        ownerFilter,
                        teamFilter: value,
                        ragFilter,
                        statusFilter,
                        dateRangeFilter,
                        startDate,
                        endDate,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All teams' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All teams</SelectItem>
                      <SelectItem value='no-team'>No team</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* RAG Filter */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>RAG Status</label>
                  <Select
                    value={ragFilter}
                    onValueChange={value => {
                      setRagFilter(value)
                      saveFilters({
                        textFilter,
                        ownerFilter,
                        teamFilter,
                        ragFilter: value,
                        statusFilter,
                        dateRangeFilter,
                        startDate,
                        endDate,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All RAG statuses' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All RAG statuses</SelectItem>
                      <SelectItem value='red'>Red</SelectItem>
                      <SelectItem value='amber'>Amber</SelectItem>
                      <SelectItem value='green'>Green</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Status</label>
                  <Select
                    value={statusFilter}
                    onValueChange={value => {
                      setStatusFilter(value)
                      saveFilters({
                        textFilter,
                        ownerFilter,
                        teamFilter,
                        ragFilter,
                        statusFilter: value,
                        dateRangeFilter,
                        startDate,
                        endDate,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All statuses' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All statuses</SelectItem>
                      <SelectItem value='planned'>Planned</SelectItem>
                      <SelectItem value='in_progress'>In Progress</SelectItem>
                      <SelectItem value='paused'>Paused</SelectItem>
                      <SelectItem value='done'>Done</SelectItem>
                      <SelectItem value='canceled'>Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Date Range</label>
                  <Select
                    value={dateRangeFilter}
                    onValueChange={value => {
                      setDateRangeFilter(value)
                      saveFilters({
                        textFilter,
                        ownerFilter,
                        teamFilter,
                        ragFilter,
                        statusFilter,
                        dateRangeFilter: value,
                        startDate,
                        endDate,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All dates' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All dates</SelectItem>
                      <SelectItem value='today'>Today</SelectItem>
                      <SelectItem value='this-week'>This week</SelectItem>
                      <SelectItem value='this-month'>This month</SelectItem>
                      <SelectItem value='last-30-days'>Last 30 days</SelectItem>
                      <SelectItem value='custom'>Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Date Range Inputs */}
                {dateRangeFilter === 'custom' && (
                  <div className='space-y-2'>
                    <div className='grid grid-cols-2 gap-2'>
                      <div>
                        <label className='text-xs text-muted-foreground'>
                          Start Date
                        </label>
                        <Input
                          type='date'
                          value={startDate}
                          onChange={e => {
                            setStartDate(e.target.value)
                            saveFilters({
                              textFilter,
                              ownerFilter,
                              teamFilter,
                              ragFilter,
                              statusFilter,
                              dateRangeFilter,
                              startDate: e.target.value,
                              endDate,
                            })
                          }}
                          className='text-xs'
                        />
                      </div>
                      <div>
                        <label className='text-xs text-muted-foreground'>
                          End Date
                        </label>
                        <Input
                          type='date'
                          value={endDate}
                          onChange={e => {
                            setEndDate(e.target.value)
                            saveFilters({
                              textFilter,
                              ownerFilter,
                              teamFilter,
                              ragFilter,
                              statusFilter,
                              dateRangeFilter,
                              startDate,
                              endDate: e.target.value,
                            })
                          }}
                          className='text-xs'
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={clearAllFilters}
                    className='w-full'
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
