'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PeopleTable } from '@/components/people/people-table'
import { PeopleFilterBar } from '@/components/people/people-filter-bar'
import { Person } from '@/types/person'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Users, Building, UserCheck, Briefcase } from 'lucide-react'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

type GroupingOption = 'manager' | 'team' | 'status' | 'jobRole'

interface GroupedPeoplePageClientProps {
  people: Person[]
}

interface PeopleGroup {
  key: string
  label: string
  people: Person[]
  count: number
}

export function GroupedPeoplePageClient({
  people,
}: GroupedPeoplePageClientProps) {
  const { getSetting, updateSetting, isLoaded } = useUserSettings()
  const [filteredPeople, setFilteredPeople] = useState<Person[]>(people)
  const [groupingOption, setGroupingOption] = useState<GroupingOption>('team')

  // Load grouping option from user settings
  useEffect(() => {
    if (isLoaded) {
      const savedGrouping = getSetting('peopleGrouping')
      setGroupingOption(savedGrouping)
    }
  }, [isLoaded, getSetting])

  // Update filtered people when people prop changes
  useEffect(() => {
    setFilteredPeople(people)
  }, [people])

  const handleFilteredPeopleChange = useCallback(
    (newFilteredPeople: Person[]) => {
      setFilteredPeople(newFilteredPeople)
    },
    []
  )

  // Group people based on the selected option
  const groupedPeople = useMemo(() => {
    const groups: PeopleGroup[] = []

    switch (groupingOption) {
      case 'manager':
        // Group by manager
        const managerGroups = new Map<string, Person[]>()

        filteredPeople.forEach(person => {
          const key = person.manager?.id || 'no-manager'
          if (!managerGroups.has(key)) {
            managerGroups.set(key, [])
          }
          managerGroups.get(key)!.push(person)
        })

        // Create groups
        managerGroups.forEach((people, key) => {
          const manager =
            people.find(p => p.id === key)?.manager ||
            filteredPeople.find(p => p.id === key)
          groups.push({
            key,
            label: manager?.name || 'No Manager',
            people: people.sort((a, b) => a.name.localeCompare(b.name)),
            count: people.length,
          })
        })

        // Sort groups by manager name
        groups.sort((a, b) => {
          if (a.key === 'no-manager') return 1
          if (b.key === 'no-manager') return -1
          return a.label.localeCompare(b.label)
        })
        break

      case 'team':
        // Group by team
        const teamGroups = new Map<string, Person[]>()

        filteredPeople.forEach(person => {
          const key = person.team?.id || 'no-team'
          if (!teamGroups.has(key)) {
            teamGroups.set(key, [])
          }
          teamGroups.get(key)!.push(person)
        })

        // Create groups
        teamGroups.forEach((people, key) => {
          const team = people.find(p => p.team?.id === key)?.team
          groups.push({
            key,
            label: team?.name || 'No Team',
            people: people.sort((a, b) => a.name.localeCompare(b.name)),
            count: people.length,
          })
        })

        // Sort groups by team name
        groups.sort((a, b) => {
          if (a.key === 'no-team') return 1
          if (b.key === 'no-team') return -1
          return a.label.localeCompare(b.label)
        })
        break

      case 'status':
        // Group by status
        const statusGroups = new Map<string, Person[]>()

        filteredPeople.forEach(person => {
          const status = person.status
          if (!statusGroups.has(status)) {
            statusGroups.set(status, [])
          }
          statusGroups.get(status)!.push(person)
        })

        // Create groups in a specific order
        const statusOrder = ['active', 'inactive', 'on_leave', 'terminated']
        statusOrder.forEach(status => {
          const people = statusGroups.get(status) || []
          if (people.length > 0) {
            groups.push({
              key: status,
              label:
                status.charAt(0).toUpperCase() +
                status.slice(1).replace('_', ' '),
              people: people.sort((a, b) => a.name.localeCompare(b.name)),
              count: people.length,
            })
          }
        })
        break

      case 'jobRole':
        // Group by job role
        const jobRoleGroups = new Map<string, Person[]>()

        filteredPeople.forEach(person => {
          const key = person.jobRole?.id || 'no-job-role'
          if (!jobRoleGroups.has(key)) {
            jobRoleGroups.set(key, [])
          }
          jobRoleGroups.get(key)!.push(person)
        })

        // Create groups
        jobRoleGroups.forEach((people, key) => {
          const jobRole = people.find(p => p.jobRole?.id === key)?.jobRole
          groups.push({
            key,
            label: jobRole?.title || 'No Job Role',
            people: people.sort((a, b) => a.name.localeCompare(b.name)),
            count: people.length,
          })
        })

        // Sort groups by job role title
        groups.sort((a, b) => {
          if (a.key === 'no-job-role') return 1
          if (b.key === 'no-job-role') return -1
          return a.label.localeCompare(b.label)
        })
        break
    }

    return groups
  }, [filteredPeople, groupingOption])

  const getGroupIcon = (option: GroupingOption) => {
    switch (option) {
      case 'manager':
        return <Users className='h-4 w-4' />
      case 'team':
        return <Building className='h-4 w-4' />
      case 'status':
        return <UserCheck className='h-4 w-4' />
      case 'jobRole':
        return <Briefcase className='h-4 w-4' />
    }
  }

  const getGroupBadgeVariant = (group: PeopleGroup) => {
    if (groupingOption === 'status') {
      const status = group.key
      switch (status) {
        case 'active':
          return 'default'
        case 'inactive':
          return 'secondary'
        case 'on_leave':
          return 'outline'
        case 'terminated':
          return 'destructive'
        default:
          return 'neutral'
      }
    }
    return 'neutral'
  }

  return (
    <div className='space-y-6'>
      {/* Filter and Grouping Controls */}
      <div className='space-y-4 px-3 md:px-0'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          {/* Filter Bar */}
          <div className='flex-1'>
            <PeopleFilterBar
              people={people}
              onFilteredPeopleChange={handleFilteredPeopleChange}
            />
          </div>

          {/* Grouping Controls */}
          <div className='flex items-center gap-4 lg:flex-shrink-0'>
            <div className='flex items-center gap-3'>
              <label
                htmlFor='grouping-select'
                className='text-sm font-medium text-muted-foreground'
              >
                Group by:
              </label>
              <Select
                value={groupingOption}
                onValueChange={(value: GroupingOption) => {
                  setGroupingOption(value)
                  updateSetting('peopleGrouping', value)
                }}
              >
                <SelectTrigger id='grouping-select' className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='manager'>
                    <div className='flex items-center gap-2'>
                      <Users className='h-4 w-4' />
                      Manager
                    </div>
                  </SelectItem>
                  <SelectItem value='team'>
                    <div className='flex items-center gap-2'>
                      <Building className='h-4 w-4' />
                      Team
                    </div>
                  </SelectItem>
                  <SelectItem value='status'>
                    <div className='flex items-center gap-2'>
                      <UserCheck className='h-4 w-4' />
                      Status
                    </div>
                  </SelectItem>
                  <SelectItem value='jobRole'>
                    <div className='flex items-center gap-2'>
                      <Briefcase className='h-4 w-4' />
                      Job Role
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='text-sm text-muted-foreground'>
              {filteredPeople.length} person
              {filteredPeople.length !== 1 ? 's' : ''} in {groupedPeople.length}{' '}
              group
              {groupedPeople.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Grouped People */}
      <div className='space-y-6'>
        {groupedPeople.map(group => (
          <div key={group.key} className='space-y-4'>
            <div className='flex items-center justify-between px-3 md:px-0'>
              <div className='flex items-center gap-3'>
                {getGroupIcon(groupingOption)}
                <h3 className='text-lg font-semibold'>{group.label}</h3>
                <Badge variant={getGroupBadgeVariant(group)}>
                  {group.count}
                </Badge>
              </div>
            </div>
            <PeopleTable people={people} filteredPeople={group.people} />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {groupedPeople.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>
            No people found matching your filters.
          </p>
        </div>
      )}
    </div>
  )
}
