'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { TaskListItem } from '@/lib/task-list-select'
import type { Person } from '@prisma/client'
import { taskStatusUtils, ALL_TASK_STATUSES } from '@/lib/task-status'
import { taskPriorityUtils, ALL_TASK_PRIORITIES } from '@/lib/task-priority'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { MultiSelect } from '@/components/ui/multi-select'
import { InitiativeMultiSelect } from '@/components/ui/initiative-multi-select'

interface TaskFilters {
  search: string
  status: string[]
  assigneeId: string[]
  initiativeId: string[]
  priority: string[]
  dueDateFrom: string
  dueDateTo: string
}

interface TasksFilterBarProps {
  tasks: TaskListItem[]
  people: Person[]
  onFilteredTasksChange: (_filters: TaskFilters) => void
  immutableFilters?: {
    search?: string
    status?: string | string[]
    assigneeId?: string | string[]
    initiativeId?: string | string[]
    priority?: string | string[]
    dueDateFrom?: string
    dueDateTo?: string
  }
}

export function TasksFilterBar({
  people,
  onFilteredTasksChange,
  immutableFilters,
}: TasksFilterBarProps) {
  const { getSetting, updateSetting, isLoaded } = useUserSettings()
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: [],
    assigneeId: [],
    initiativeId: [],
    priority: [],
    dueDateFrom: '',
    dueDateTo: '',
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // Load filter values from user settings
  useEffect(() => {
    if (isLoaded) {
      const savedFilters = getSetting('taskFilters') as Partial<
        TaskFilters & {
          textFilter?: string
          statusFilter?: string | string[]
          assigneeFilter?: string | string[]
          initiativeFilter?: string | string[]
          priorityFilter?: string | string[]
          startDate?: string
          endDate?: string
        }
      >
      if (savedFilters) {
        // Helper function to convert old single value to array
        const toArray = (
          value: string | string[] | undefined,
          oldValue: string | string[] | undefined
        ): string[] => {
          // Check new format first
          if (Array.isArray(value)) return value
          if (value && value !== 'all') return [value]

          // Check old format
          if (Array.isArray(oldValue)) return oldValue
          if (oldValue && oldValue !== 'all') return [oldValue]

          return []
        }

        // Handle both old and new filter formats
        setFilters({
          search: savedFilters.search || savedFilters.textFilter || '',
          status: toArray(savedFilters.status, savedFilters.statusFilter),
          assigneeId: toArray(
            savedFilters.assigneeId,
            savedFilters.assigneeFilter
          ),
          initiativeId: toArray(
            savedFilters.initiativeId,
            savedFilters.initiativeFilter
          ),
          priority: toArray(savedFilters.priority, savedFilters.priorityFilter),
          dueDateFrom: savedFilters.dueDateFrom || savedFilters.startDate || '',
          dueDateTo: savedFilters.dueDateTo || savedFilters.endDate || '',
        })
      }
    }
  }, [isLoaded, getSetting])

  // Helper function to save filter values to user settings
  const saveFilters = useCallback(
    (newFilters: TaskFilters) => {
      updateSetting('taskFilters', {
        textFilter: newFilters.search,
        assigneeFilter: newFilters.assigneeId as string | string[],
        initiativeFilter: newFilters.initiativeId as string | string[],
        statusFilter: newFilters.status as string | string[],
        priorityFilter: newFilters.priority as string | string[],
        dateRangeFilter: 'all',
        startDate: newFilters.dueDateFrom,
        endDate: newFilters.dueDateTo,
      })
    },
    [updateSetting]
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
    if (!isLoaded) {
      return
    }

    onFilteredTasksChange(filters)
    saveFilters(filters)
  }, [filters, isLoaded, onFilteredTasksChange, saveFilters])

  const updateFilter = (key: keyof TaskFilters, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    const defaultFilters: TaskFilters = {
      search: '',
      status: [],
      assigneeId: [],
      initiativeId: [],
      priority: [],
      dueDateFrom: '',
      dueDateTo: '',
    }

    setFilters(defaultFilters)
    saveFilters(defaultFilters)
  }

  const hasActiveFilters =
    filters.search.trim() ||
    filters.status.length > 0 ||
    filters.assigneeId.length > 0 ||
    filters.initiativeId.length > 0 ||
    filters.priority.length > 0 ||
    filters.dueDateFrom ||
    filters.dueDateTo

  return (
    <div className='space-y-4 px-0'>
      {/* Search and Filter Bar */}
      <div className='flex items-center gap-4'>
        {/* Search Input - Hidden if immutable */}
        {!immutableFilters?.search && (
          <div className='relative flex-1 max-w-sm'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
            <Input
              placeholder='Search tasks...'
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              className='pl-10'
            />
          </div>
        )}

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
                {/* Assignee Filter - Hidden if immutable */}
                {!immutableFilters?.assigneeId && (
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Assignee</label>
                    <MultiSelect
                      options={[
                        { label: 'Unassigned', value: 'unassigned' },
                        ...people.map(person => ({
                          label: person.name,
                          value: person.id,
                        })),
                      ]}
                      selected={filters.assigneeId}
                      onChange={value => updateFilter('assigneeId', value)}
                      placeholder='All assignees'
                    />
                  </div>
                )}

                {/* Status Filter - Hidden if immutable */}
                {!immutableFilters?.status && (
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Status</label>
                    <MultiSelect
                      options={ALL_TASK_STATUSES.map(status => ({
                        label: taskStatusUtils.getLabel(status),
                        value: status,
                      }))}
                      selected={filters.status}
                      onChange={value => updateFilter('status', value)}
                      placeholder='All statuses'
                    />
                  </div>
                )}

                {/* Priority Filter - Hidden if immutable */}
                {!immutableFilters?.priority && (
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Priority</label>
                    <MultiSelect
                      options={ALL_TASK_PRIORITIES.map(priority => ({
                        label: taskPriorityUtils.getLabel(priority),
                        value: priority.toString(),
                      }))}
                      selected={filters.priority}
                      onChange={value => updateFilter('priority', value)}
                      placeholder='All priorities'
                    />
                  </div>
                )}

                {/* Initiative Filter - Hidden if immutable */}
                {!immutableFilters?.initiativeId && (
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Initiative</label>
                    <InitiativeMultiSelect
                      selected={filters.initiativeId}
                      onChange={value => updateFilter('initiativeId', value)}
                      placeholder='All initiatives'
                    />
                  </div>
                )}

                {/* Due Date From Filter - Hidden if immutable */}
                {!immutableFilters?.dueDateFrom && (
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Due Date From</label>
                    <Input
                      type='date'
                      value={filters.dueDateFrom}
                      onChange={e =>
                        updateFilter('dueDateFrom', e.target.value)
                      }
                    />
                  </div>
                )}

                {/* Due Date To Filter - Hidden if immutable */}
                {!immutableFilters?.dueDateTo && (
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Due Date To</label>
                    <Input
                      type='date'
                      value={filters.dueDateTo}
                      onChange={e => updateFilter('dueDateTo', e.target.value)}
                    />
                  </div>
                )}
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

// Legacy wrapper for backward compatibility
interface LegacyTasksFilterBarProps {
  tasks: TaskListItem[]
  people: Person[]
  onFilteredTasksChange: (_filteredTasks: TaskListItem[]) => void
  immutableFilters?: {
    search?: string
    status?: string | string[]
    assigneeId?: string | string[]
    initiativeId?: string | string[]
    priority?: string | string[]
    dueDateFrom?: string
    dueDateTo?: string
  }
}

export function LegacyTasksFilterBar({
  tasks,
  people,
  onFilteredTasksChange,
  immutableFilters,
}: LegacyTasksFilterBarProps) {
  const [, setFilteredTasks] = useState<TaskListItem[]>(tasks)

  // Update filtered tasks when tasks prop changes
  useEffect(() => {
    setFilteredTasks(tasks)
  }, [tasks])

  const handleFiltersChange = useCallback(
    (filters: TaskFilters) => {
      let filtered = tasks

      // Text filter - search in title and description
      if (filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase().trim()
        filtered = filtered.filter(task => {
          const title = task.title?.toLowerCase() || ''
          const description = task.description?.toLowerCase() || ''
          const assigneeName = task.assignee?.name?.toLowerCase() || ''
          const initiativeTitle = task.initiative?.title?.toLowerCase() || ''

          return (
            title.includes(searchTerm) ||
            description.includes(searchTerm) ||
            assigneeName.includes(searchTerm) ||
            initiativeTitle.includes(searchTerm)
          )
        })
      }

      // Assignee filter
      if (filters.assigneeId.length > 0) {
        filtered = filtered.filter(task => {
          if (filters.assigneeId.includes('unassigned')) {
            // Include unassigned tasks if 'unassigned' is selected
            if (!task.assigneeId) return true
          }
          // Include tasks with matching assignee
          return task.assigneeId && filters.assigneeId.includes(task.assigneeId)
        })
      }

      // Initiative filter
      if (filters.initiativeId.length > 0) {
        filtered = filtered.filter(task => {
          if (filters.initiativeId.includes('no-initiative')) {
            // Include tasks without initiative if 'no-initiative' is selected
            if (!task.initiativeId) return true
          }
          // Include tasks with matching initiative
          return (
            task.initiativeId &&
            filters.initiativeId.includes(task.initiativeId)
          )
        })
      }

      // Status filter
      if (filters.status.length > 0) {
        filtered = filtered.filter(task => filters.status.includes(task.status))
      }

      // Priority filter
      if (filters.priority.length > 0) {
        filtered = filtered.filter(task =>
          filters.priority.includes(task.priority.toString())
        )
      }

      // Due date filters
      if (filters.dueDateFrom) {
        const fromDate = new Date(filters.dueDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false
          const taskDueDate = new Date(task.dueDate)
          return taskDueDate >= fromDate
        })
      }

      if (filters.dueDateTo) {
        const toDate = new Date(filters.dueDateTo)
        toDate.setHours(23, 59, 59, 999)
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false
          const taskDueDate = new Date(task.dueDate)
          return taskDueDate <= toDate
        })
      }

      setFilteredTasks(filtered)
      onFilteredTasksChange(filtered)
    },
    [tasks, onFilteredTasksChange]
  )

  return (
    <TasksFilterBar
      tasks={tasks}
      people={people}
      onFilteredTasksChange={handleFiltersChange}
      immutableFilters={immutableFilters}
    />
  )
}
