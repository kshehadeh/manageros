'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MeetingsTable } from '@/components/meetings-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Filter, X, Calendar } from 'lucide-react'
import {
  Meeting,
  Team,
  Initiative,
  Person,
  User as PrismaUser,
} from '@prisma/client'
import { HelpIcon } from '@/components/help-icon'

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

interface MeetingsPageClientProps {
  meetings: MeetingWithRelations[]
}

interface FilterState {
  keyword: string
  teamId: string
  initiativeId: string
  status: string
  ownerId: string
}

export function MeetingsPageClient({ meetings }: MeetingsPageClientProps) {
  const [filteredMeetings, setFilteredMeetings] =
    useState<MeetingWithRelations[]>(meetings)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    teamId: 'all',
    initiativeId: 'all',
    status: 'all',
    ownerId: 'all',
  })

  // Extract unique values for filter dropdowns
  const teams = useMemo(() => {
    const teamMap = new Map<string, { id: string; name: string }>()
    meetings.forEach(meeting => {
      if (meeting.team) {
        teamMap.set(meeting.team.id, {
          id: meeting.team.id,
          name: meeting.team.name,
        })
      }
    })
    return Array.from(teamMap.values())
  }, [meetings])

  const initiatives = useMemo(() => {
    const initiativeMap = new Map<string, { id: string; title: string }>()
    meetings.forEach(meeting => {
      if (meeting.initiative) {
        initiativeMap.set(meeting.initiative.id, {
          id: meeting.initiative.id,
          title: meeting.initiative.title,
        })
      }
    })
    return Array.from(initiativeMap.values())
  }, [meetings])

  const owners = useMemo(() => {
    const ownerMap = new Map<string, { id: string; name: string }>()
    meetings.forEach(meeting => {
      if (meeting.owner) {
        ownerMap.set(meeting.owner.id, {
          id: meeting.owner.id,
          name: meeting.owner.name,
        })
      }
    })
    return Array.from(ownerMap.values())
  }, [meetings])

  // Apply filters
  useMemo(() => {
    let filtered = meetings

    // Keyword filter
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      filtered = filtered.filter(
        meeting =>
          meeting.title.toLowerCase().includes(keyword) ||
          meeting.description?.toLowerCase().includes(keyword) ||
          meeting.location?.toLowerCase().includes(keyword)
      )
    }

    // Team filter
    if (filters.teamId && filters.teamId !== 'all') {
      filtered = filtered.filter(meeting => meeting.team?.id === filters.teamId)
    }

    // Initiative filter
    if (filters.initiativeId && filters.initiativeId !== 'all') {
      filtered = filtered.filter(
        meeting => meeting.initiative?.id === filters.initiativeId
      )
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      const now = new Date()
      filtered = filtered.filter(meeting => {
        const scheduledAt = new Date(meeting.scheduledAt)
        switch (filters.status) {
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
    if (filters.ownerId && filters.ownerId !== 'all') {
      filtered = filtered.filter(
        meeting => meeting.owner?.id === filters.ownerId
      )
    }

    setFilteredMeetings(filtered)
  }, [meetings, filters])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      keyword: '',
      teamId: 'all',
      initiativeId: 'all',
      status: 'all',
      ownerId: 'all',
    })
  }

  const hasActiveFilters = Object.values(filters).some(
    filter => filter !== '' && filter !== 'all'
  )

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <Calendar className='h-6 w-6 text-muted-foreground' />
              <h1 className='page-title'>Meetings</h1>
              <HelpIcon helpId='meetings-and-instances' size='md' />
            </div>
            <p className='page-subtitle'>
              Manage and track your organization&apos;s meetings
            </p>
          </div>
          <Button asChild variant='outline'>
            <Link href='/meetings/new' className='flex items-center gap-2'>
              <Plus className='h-4 w-4' />
              New Meeting
            </Link>
          </Button>
        </div>
      </div>

      <div className='page-section'>
        {/* Filter Controls */}
        <div className='space-y-4'>
          <div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 transition-all duration-200 ${
                    showFilters
                      ? 'rounded-b-none border-b-0 bg-background'
                      : 'rounded-lg'
                  }`}
                >
                  <Filter className='h-4 w-4' />
                  Filters
                  {hasActiveFilters && (
                    <div className='h-2 w-2 bg-primary rounded-full' />
                  )}
                </Button>
              </div>
              <div className='text-sm text-muted-foreground'>
                Showing {filteredMeetings.length} of {meetings.length} meetings
              </div>
            </div>

            {showFilters && (
              <div className='border border-t-0 rounded-b-lg rounded-t-none p-4 bg-muted/30'>
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
                  {/* Search */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Search</label>
                    <div className='relative'>
                      <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                      <Input
                        placeholder='Search meetings...'
                        value={filters.keyword}
                        onChange={e =>
                          handleFilterChange('keyword', e.target.value)
                        }
                        className='pl-8'
                      />
                    </div>
                  </div>

                  {/* Team Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Team</label>
                    <Select
                      value={filters.teamId}
                      onValueChange={value =>
                        handleFilterChange('teamId', value)
                      }
                    >
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

                  {/* Initiative Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Initiative</label>
                    <Select
                      value={filters.initiativeId}
                      onValueChange={value =>
                        handleFilterChange('initiativeId', value)
                      }
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

                  {/* Status Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={value =>
                        handleFilterChange('status', value)
                      }
                    >
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

                  {/* Owner Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Owner</label>
                    <Select
                      value={filters.ownerId}
                      onValueChange={value =>
                        handleFilterChange('ownerId', value)
                      }
                    >
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

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <div className='mt-4 pt-4 border-t'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={clearFilters}
                      className='flex items-center gap-2'
                    >
                      <X className='w-4 h-4' />
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <MeetingsTable
          meetings={meetings}
          filteredMeetings={filteredMeetings}
        />
      </div>
    </div>
  )
}
