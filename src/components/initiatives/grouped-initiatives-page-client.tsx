'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { InitiativesTable } from '@/components/initiatives/initiatives-table'
import { InitiativesFilterBar } from '@/components/initiatives/initiatives-filter-bar'
import { Person, Team } from '@prisma/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Users, Target } from 'lucide-react'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

interface InitiativeWithRelations {
  id: string
  title: string
  summary: string | null
  outcome: string | null
  startDate: Date | null
  targetDate: Date | null
  status: string
  rag: string
  confidence: number
  teamId: string | null
  organizationId: string
  createdAt: Date
  updatedAt: Date
  objectives: Array<{
    id: string
    title: string
    keyResult: string | null
    sortIndex: number
  }>
  team: {
    id: string
    name: string
  } | null
  owners: Array<{
    personId: string
    role: string
    person: {
      id: string
      name: string
    }
  }>
  _count: {
    checkIns: number
    tasks: number
  }
  tasks: Array<{
    status: string
  }>
}

type GroupingOption = 'team' | 'rag'

interface GroupedInitiativesPageClientProps {
  initiatives: InitiativeWithRelations[]
  people: Person[]
  teams: Team[]
}

interface InitiativeGroup {
  key: string
  label: string
  initiatives: InitiativeWithRelations[]
  count: number
}

export function GroupedInitiativesPageClient({
  initiatives,
  people,
  teams,
}: GroupedInitiativesPageClientProps) {
  const { getSetting, updateSetting, isLoaded } = useUserSettings()
  const [filteredInitiatives, setFilteredInitiatives] =
    useState<InitiativeWithRelations[]>(initiatives)
  const [groupingOption, setGroupingOption] = useState<GroupingOption>('rag')

  // Load grouping option from user settings
  useEffect(() => {
    if (isLoaded) {
      const savedGrouping = getSetting('initiativeGrouping')
      setGroupingOption(savedGrouping)
    }
  }, [isLoaded, getSetting])

  // Update filtered initiatives when initiatives prop changes
  useEffect(() => {
    setFilteredInitiatives(initiatives)
  }, [initiatives])

  const handleFilteredInitiativesChange = useCallback(
    (newFilteredInitiatives: InitiativeWithRelations[]) => {
      setFilteredInitiatives(newFilteredInitiatives)
    },
    []
  )

  // Group initiatives based on the selected option
  const groupedInitiatives = useMemo(() => {
    const groups: InitiativeGroup[] = []

    switch (groupingOption) {
      case 'team':
        // Group by team
        const teamGroups = new Map<string, InitiativeWithRelations[]>()

        filteredInitiatives.forEach(initiative => {
          const key = initiative.teamId || 'no-team'
          if (!teamGroups.has(key)) {
            teamGroups.set(key, [])
          }
          teamGroups.get(key)!.push(initiative)
        })

        // Create groups
        teamGroups.forEach((initiatives, key) => {
          const team = teams.find(t => t.id === key)
          groups.push({
            key,
            label: team?.name || 'No Team',
            initiatives: initiatives.sort((a, b) => {
              // Sort by RAG status priority, then by title
              const ragOrder = ['red', 'amber', 'green']
              const aRagIndex = ragOrder.indexOf(a.rag)
              const bRagIndex = ragOrder.indexOf(b.rag)

              if (aRagIndex !== bRagIndex) {
                return aRagIndex - bRagIndex
              }

              return a.title.localeCompare(b.title)
            }),
            count: initiatives.length,
          })
        })

        // Sort groups by team name
        groups.sort((a, b) => {
          if (a.key === 'no-team') return 1
          if (b.key === 'no-team') return -1
          return a.label.localeCompare(b.label)
        })
        break

      case 'rag':
        // Group by RAG status
        const ragGroups = new Map<string, InitiativeWithRelations[]>()

        filteredInitiatives.forEach(initiative => {
          const rag = initiative.rag
          if (!ragGroups.has(rag)) {
            ragGroups.set(rag, [])
          }
          ragGroups.get(rag)!.push(initiative)
        })

        // Create groups in a specific order
        const ragOrder = ['red', 'amber', 'green']
        ragOrder.forEach(rag => {
          const initiatives = ragGroups.get(rag) || []
          if (initiatives.length > 0) {
            groups.push({
              key: rag,
              label: rag.charAt(0).toUpperCase() + rag.slice(1),
              initiatives: initiatives.sort((a, b) => {
                // Sort by title within each RAG group
                return a.title.localeCompare(b.title)
              }),
              count: initiatives.length,
            })
          }
        })
        break
    }

    return groups
  }, [filteredInitiatives, groupingOption, teams])

  const getGroupIcon = (option: GroupingOption) => {
    switch (option) {
      case 'team':
        return <Users className='h-4 w-4' />
      case 'rag':
        return <Target className='h-4 w-4' />
    }
  }

  const getGroupBadgeVariant = (group: InitiativeGroup) => {
    if (groupingOption === 'rag') {
      const rag = group.key
      switch (rag) {
        case 'red':
          return 'destructive'
        case 'amber':
          return 'secondary'
        case 'green':
          return 'default'
        default:
          return 'neutral'
      }
    }
    return 'neutral'
  }

  const getRagColor = (rag: string) => {
    switch (rag) {
      case 'red':
        return 'bg-red-500'
      case 'amber':
        return 'bg-amber-500'
      case 'green':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className='space-y-6'>
      {/* Filter and Grouping Controls */}
      <div className='space-y-4 px-0'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          {/* Filter Bar */}
          <div className='flex-1'>
            <InitiativesFilterBar
              initiatives={initiatives}
              people={people}
              teams={teams}
              onFilteredInitiativesChange={handleFilteredInitiativesChange}
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
                  updateSetting('initiativeGrouping', value)
                }}
              >
                <SelectTrigger id='grouping-select' className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='team'>
                    <div className='flex items-center gap-2'>
                      <Users className='h-4 w-4' />
                      Team
                    </div>
                  </SelectItem>
                  <SelectItem value='rag'>
                    <div className='flex items-center gap-2'>
                      <Target className='h-4 w-4' />
                      RAG Status
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='text-sm text-muted-foreground'>
              {filteredInitiatives.length} initiative
              {filteredInitiatives.length !== 1 ? 's' : ''} in{' '}
              {groupedInitiatives.length} group
              {groupedInitiatives.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Grouped Initiatives */}
      <div className='space-y-6'>
        {groupedInitiatives.map(group => (
          <div key={group.key} className='space-y-4'>
            <div className='flex items-center justify-between px-0'>
              <div className='flex items-center gap-3'>
                {groupingOption === 'rag' && (
                  <div
                    className={`w-3 h-3 rounded-full ${getRagColor(group.key)}`}
                  />
                )}
                {groupingOption === 'team' && getGroupIcon(groupingOption)}
                <h3 className='text-lg font-semibold'>{group.label}</h3>
                <Badge variant={getGroupBadgeVariant(group)}>
                  {group.count}
                </Badge>
              </div>
            </div>
            <InitiativesTable
              initiatives={group.initiatives}
              people={people}
              teams={teams}
              hideFilters={true}
            />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {groupedInitiatives.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>
            No initiatives found matching your filters.
          </p>
        </div>
      )}
    </div>
  )
}
