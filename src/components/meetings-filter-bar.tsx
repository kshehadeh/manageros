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
import {
  Meeting,
  Team,
  Initiative,
  Person,
  User as PrismaUser,
} from '@prisma/client'

type MeetingWithRelations = Meeting & {
  team: Team | null
  initiative: Initiative | null
  owner: Person | null
  createdBy: PrismaUser | null
  participants: Array<{
    person: Person
    status: string
  }>
}

interface MeetingsFilterBarProps {
  meetings: MeetingWithRelations[]
  onFilteredMeetingsChange: (_filteredMeetings: MeetingWithRelations[]) => void
}

export function MeetingsFilterBar({
  meetings,
  onFilteredMeetingsChange,
}: MeetingsFilterBarProps) {
  const [textFilter, setTextFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [initiativeFilter, setInitiativeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // Extract unique values for filter dropdowns
  const teams = Array.from(
    new Map(
      meetings
        .filter(meeting => meeting.team)
        .map(meeting => [
          meeting.team!.id,
          { id: meeting.team!.id, name: meeting.team!.name },
        ])
    ).values()
  )

  const initiatives = Array.from(
    new Map(
      meetings
        .filter(meeting => meeting.initiative)
        .map(meeting => [
          meeting.initiative!.id,
          { id: meeting.initiative!.id, title: meeting.initiative!.title },
        ])
    ).values()
  )

  const owners = Array.from(
    new Map(
      meetings
        .filter(meeting => meeting.owner)
        .map(meeting => [
          meeting.owner!.id,
          { id: meeting.owner!.id, name: meeting.owner!.name },
        ])
    ).values()
  )

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
    let filtered = [...meetings]

    // Text filter - search in title, description, and location
    if (textFilter.trim()) {
      const searchTerm = textFilter.toLowerCase().trim()
      filtered = filtered.filter(meeting => {
        const title = meeting.title?.toLowerCase() || ''
        const description = meeting.description?.toLowerCase() || ''
        const location = meeting.location?.toLowerCase() || ''
        const teamName = meeting.team?.name?.toLowerCase() || ''
        const initiativeTitle = meeting.initiative?.title?.toLowerCase() || ''
        const ownerName = meeting.owner?.name?.toLowerCase() || ''

        return (
          title.includes(searchTerm) ||
          description.includes(searchTerm) ||
          location.includes(searchTerm) ||
          teamName.includes(searchTerm) ||
          initiativeTitle.includes(searchTerm) ||
          ownerName.includes(searchTerm)
        )
      })
    }

    // Team filter
    if (teamFilter !== 'all') {
      filtered = filtered.filter(meeting => meeting.team?.id === teamFilter)
    }

    // Initiative filter
    if (initiativeFilter !== 'all') {
      filtered = filtered.filter(
        meeting => meeting.initiative?.id === initiativeFilter
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(meeting => {
        const scheduledAt = new Date(meeting.scheduledAt)
        switch (statusFilter) {
          case 'past':
            return scheduledAt < now
          case 'today':
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            return scheduledAt >= today && scheduledAt < tomorrow
          case 'upcoming':
            return scheduledAt >= now
          default:
            return true
        }
      })
    }

    // Owner filter
    if (ownerFilter !== 'all') {
      filtered = filtered.filter(meeting => meeting.owner?.id === ownerFilter)
    }

    onFilteredMeetingsChange(filtered)
  }, [
    meetings,
    textFilter,
    teamFilter,
    initiativeFilter,
    statusFilter,
    ownerFilter,
    onFilteredMeetingsChange,
  ])

  const clearFilters = () => {
    setTextFilter('')
    setTeamFilter('all')
    setInitiativeFilter('all')
    setStatusFilter('all')
    setOwnerFilter('all')
  }

  const hasActiveFilters =
    textFilter.trim() ||
    teamFilter !== 'all' ||
    initiativeFilter !== 'all' ||
    statusFilter !== 'all' ||
    ownerFilter !== 'all'

  return (
    <div className='space-y-4 px-3 md:px-0'>
      {/* Search and Filter Bar */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            placeholder='Search meetings...'
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
                  <label className='text-sm font-medium'>Initiative</label>
                  <Select
                    value={initiativeFilter}
                    onValueChange={setInitiativeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All initiatives' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All initiatives</SelectItem>
                      {initiatives.map(initiative => (
                        <SelectItem key={initiative.id} value={initiative.id}>
                          {initiative.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder='All statuses' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All statuses</SelectItem>
                      <SelectItem value='past'>Past</SelectItem>
                      <SelectItem value='today'>Today</SelectItem>
                      <SelectItem value='upcoming'>Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Owner</label>
                  <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder='All owners' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All owners</SelectItem>
                      {owners.map(owner => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.name}
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
