'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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
import { TeamWithCounts } from '@/types/team'

interface TeamsFilterBarProps {
  teams: TeamWithCounts[]
  onFilteredTeamsChange: (_filteredTeams: TeamWithCounts[]) => void
}

export function TeamsFilterBar({
  teams,
  onFilteredTeamsChange,
}: TeamsFilterBarProps) {
  const [textFilter, setTextFilter] = useState('')
  const [parentFilter, setParentFilter] = useState('all')
  const [membersFilter, setMembersFilter] = useState('all')
  const [initiativesFilter, setInitiativesFilter] = useState('all')
  const [childrenFilter, setChildrenFilter] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // Get unique parent teams for filter dropdown
  const parentTeams = useMemo(() => {
    return teams
      .filter(team => team.parent)
      .map(team => team.parent!)
      .filter(
        (parent, index, self) =>
          index === self.findIndex(p => p.id === parent.id)
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [teams])

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
    let filtered = [...teams]

    // Text filter - search in name and description
    if (textFilter.trim()) {
      const searchTerm = textFilter.toLowerCase().trim()
      filtered = filtered.filter(team => {
        const name = team.name?.toLowerCase() || ''
        const description = team.description?.toLowerCase() || ''
        const parentName = team.parent?.name?.toLowerCase() || ''

        return (
          name.includes(searchTerm) ||
          description.includes(searchTerm) ||
          parentName.includes(searchTerm)
        )
      })
    }

    // Parent filter
    if (parentFilter !== 'all') {
      if (parentFilter === 'no-parent') {
        filtered = filtered.filter(team => !team.parentId)
      } else {
        filtered = filtered.filter(team => team.parentId === parentFilter)
      }
    }

    // Members filter
    if (membersFilter !== 'all') {
      if (membersFilter === 'has-members') {
        filtered = filtered.filter(team => team._count.people > 0)
      } else if (membersFilter === 'no-members') {
        filtered = filtered.filter(team => team._count.people === 0)
      }
    }

    // Initiatives filter
    if (initiativesFilter !== 'all') {
      if (initiativesFilter === 'has-initiatives') {
        filtered = filtered.filter(team => team._count.initiatives > 0)
      } else if (initiativesFilter === 'no-initiatives') {
        filtered = filtered.filter(team => team._count.initiatives === 0)
      }
    }

    // Children filter
    if (childrenFilter !== 'all') {
      if (childrenFilter === 'has-children') {
        filtered = filtered.filter(team => team._count.children > 0)
      } else if (childrenFilter === 'no-children') {
        filtered = filtered.filter(team => team._count.children === 0)
      }
    }

    onFilteredTeamsChange(filtered)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    teams,
    textFilter,
    parentFilter,
    membersFilter,
    initiativesFilter,
    childrenFilter,
  ])

  const clearFilters = () => {
    setTextFilter('')
    setParentFilter('all')
    setMembersFilter('all')
    setInitiativesFilter('all')
    setChildrenFilter('all')
  }

  const hasActiveFilters =
    textFilter.trim() ||
    parentFilter !== 'all' ||
    membersFilter !== 'all' ||
    initiativesFilter !== 'all' ||
    childrenFilter !== 'all'

  return (
    <div className='space-y-4 px-3 md:px-0'>
      {/* Search and Filter Bar */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            placeholder='Search teams...'
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
                  <label className='text-sm font-medium'>Parent Team</label>
                  <Select value={parentFilter} onValueChange={setParentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder='All teams' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All teams</SelectItem>
                      <SelectItem value='no-parent'>No parent</SelectItem>
                      {parentTeams.map(parent => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Members</label>
                  <Select
                    value={membersFilter}
                    onValueChange={setMembersFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All</SelectItem>
                      <SelectItem value='has-members'>Has members</SelectItem>
                      <SelectItem value='no-members'>No members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Initiatives</label>
                  <Select
                    value={initiativesFilter}
                    onValueChange={setInitiativesFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All</SelectItem>
                      <SelectItem value='has-initiatives'>
                        Has initiatives
                      </SelectItem>
                      <SelectItem value='no-initiatives'>
                        No initiatives
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Child Teams</label>
                  <Select
                    value={childrenFilter}
                    onValueChange={setChildrenFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All</SelectItem>
                      <SelectItem value='has-children'>
                        Has child teams
                      </SelectItem>
                      <SelectItem value='no-children'>
                        No child teams
                      </SelectItem>
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
