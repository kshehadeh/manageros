'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import type { TaskListItem } from '@/lib/task-list-select'
import type { Person } from '@prisma/client'
import { taskStatusUtils, ALL_TASK_STATUSES } from '@/lib/task-status'
import { taskPriorityUtils, ALL_TASK_PRIORITIES } from '@/lib/task-priority'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { InitiativeSelect } from '@/components/ui/initiative-select'

interface TaskFilters {
  search: string
  status: string
  assigneeId: string
  initiativeId: string
  priority: string
  dueDateFrom: string
  dueDateTo: string
}

interface TasksFilterBarProps {
  tasks: TaskListItem[]
  people: Person[]
  onFilteredTasksChange: (_filters: TaskFilters) => void
}

export function TasksFilterBar({
  people,
  onFilteredTasksChange,
}: TasksFilterBarProps) {
  const { getSetting, updateSetting, isLoaded } = useUserSettings()
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: 'all',
    assigneeId: 'all',
    initiativeId: 'all',
    priority: 'all',
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
          statusFilter?: string
          assigneeFilter?: string
          initiativeFilter?: string
          priorityFilter?: string
          startDate?: string
          endDate?: string
        }
      >
      if (savedFilters) {
        // Handle both old and new filter formats
        setFilters({
          search: savedFilters.search || savedFilters.textFilter || '',
          status: savedFilters.status || savedFilters.statusFilter || 'all',
          assigneeId:
            savedFilters.assigneeId || savedFilters.assigneeFilter || 'all',
          initiativeId:
            savedFilters.initiativeId || savedFilters.initiativeFilter || 'all',
          priority:
            savedFilters.priority || savedFilters.priorityFilter || 'all',
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
        assigneeFilter: newFilters.assigneeId,
        initiativeFilter: newFilters.initiativeId,
        statusFilter: newFilters.status,
        priorityFilter: newFilters.priority,
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

  const updateFilter = (key: keyof TaskFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    const defaultFilters: TaskFilters = {
      search: '',
      status: 'all',
      assigneeId: 'all',
      initiativeId: 'all',
      priority: 'all',
      dueDateFrom: '',
      dueDateTo: '',
    }

    setFilters(defaultFilters)
    saveFilters(defaultFilters)
  }

  const hasActiveFilters =
    filters.search.trim() ||
    (filters.status && filters.status !== 'all') ||
    (filters.assigneeId && filters.assigneeId !== 'all') ||
    (filters.initiativeId && filters.initiativeId !== 'all') ||
    (filters.priority && filters.priority !== 'all') ||
    filters.dueDateFrom ||
    filters.dueDateTo

  return (
    <div className='space-y-4 px-0'>
      {/* Search and Filter Bar */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            placeholder='Search tasks...'
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
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
                  <label className='text-sm font-medium'>Assignee</label>
                  <Select
                    value={filters.assigneeId}
                    onValueChange={value => updateFilter('assigneeId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All assignees' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All assignees</SelectItem>
                      <SelectItem value='unassigned'>Unassigned</SelectItem>
                      {people.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Initiative</label>
                  <InitiativeSelect
                    value={
                      filters.initiativeId === 'all' ||
                      filters.initiativeId === 'no-initiative'
                        ? 'none'
                        : filters.initiativeId
                    }
                    onValueChange={value => {
                      // Map the select value back to filter value
                      if (value === 'none') {
                        updateFilter('initiativeId', 'all')
                      } else {
                        updateFilter('initiativeId', value)
                      }
                    }}
                    placeholder='All initiatives'
                    includeNone={true}
                    noneLabel='All initiatives'
                    showStatus={true}
                    showTeam={false}
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Status</label>
                  <Select
                    value={filters.status}
                    onValueChange={value => updateFilter('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All statuses' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All statuses</SelectItem>
                      {ALL_TASK_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                          {taskStatusUtils.getLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Priority</label>
                  <Select
                    value={filters.priority}
                    onValueChange={value => updateFilter('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All priorities' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All priorities</SelectItem>
                      {ALL_TASK_PRIORITIES.map(priority => (
                        <SelectItem key={priority} value={priority.toString()}>
                          {taskPriorityUtils.getLabel(priority)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Due Date From</label>
                  <Input
                    type='date'
                    value={filters.dueDateFrom}
                    onChange={e => updateFilter('dueDateFrom', e.target.value)}
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Due Date To</label>
                  <Input
                    type='date'
                    value={filters.dueDateTo}
                    onChange={e => updateFilter('dueDateTo', e.target.value)}
                  />
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

// Legacy wrapper for backward compatibility
interface LegacyTasksFilterBarProps {
  tasks: TaskListItem[]
  people: Person[]
  onFilteredTasksChange: (_filteredTasks: TaskListItem[]) => void
}

export function LegacyTasksFilterBar({
  tasks,
  people,
  onFilteredTasksChange,
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
      if (filters.assigneeId) {
        if (filters.assigneeId === 'unassigned') {
          filtered = filtered.filter(task => !task.assigneeId)
        } else {
          filtered = filtered.filter(
            task => task.assigneeId === filters.assigneeId
          )
        }
      }

      // Initiative filter
      if (filters.initiativeId) {
        if (filters.initiativeId === 'no-initiative') {
          filtered = filtered.filter(task => !task.initiativeId)
        } else {
          filtered = filtered.filter(
            task => task.initiativeId === filters.initiativeId
          )
        }
      }

      // Status filter
      if (filters.status) {
        filtered = filtered.filter(task => task.status === filters.status)
      }

      // Priority filter
      if (filters.priority) {
        filtered = filtered.filter(
          task => task.priority.toString() === filters.priority
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
    />
  )
}
