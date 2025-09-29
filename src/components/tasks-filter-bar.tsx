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
import { Task, Person, Initiative, Objective, User } from '@prisma/client'
import { taskStatusUtils, ALL_TASK_STATUSES } from '@/lib/task-status'
import { taskPriorityUtils, ALL_TASK_PRIORITIES } from '@/lib/task-priority'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

type TaskWithRelations = Task & {
  assignee: Person | null
  initiative: Initiative | null
  objective: Objective | null
  createdBy: User | null
}

interface TasksFilterBarProps {
  tasks: TaskWithRelations[]
  people: Person[]
  initiatives: Initiative[]
  onFilteredTasksChange: (_filteredTasks: TaskWithRelations[]) => void
}

export function TasksFilterBar({
  tasks,
  people,
  initiatives,
  onFilteredTasksChange,
}: TasksFilterBarProps) {
  const { getSetting, updateSetting, isLoaded } = useUserSettings()
  const [textFilter, setTextFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [initiativeFilter, setInitiativeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // Load filter values from user settings
  useEffect(() => {
    if (isLoaded) {
      const savedFilters = getSetting('taskFilters')
      setTextFilter(savedFilters.textFilter)
      setAssigneeFilter(savedFilters.assigneeFilter)
      setInitiativeFilter(savedFilters.initiativeFilter)
      setStatusFilter(savedFilters.statusFilter)
      setPriorityFilter(savedFilters.priorityFilter)
      setDateRangeFilter(savedFilters.dateRangeFilter)
      setStartDate(savedFilters.startDate)
      setEndDate(savedFilters.endDate)
    }
  }, [isLoaded, getSetting])

  // Helper function to save filter values to user settings
  const saveFilters = (filters: {
    textFilter: string
    assigneeFilter: string
    initiativeFilter: string
    statusFilter: string
    priorityFilter: string
    dateRangeFilter: string
    startDate: string
    endDate: string
  }) => {
    updateSetting('taskFilters', filters)
  }

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
    let filtered = [...tasks]

    // Text filter - search in title and description
    if (textFilter.trim()) {
      const searchTerm = textFilter.toLowerCase().trim()
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
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') {
        filtered = filtered.filter(task => !task.assigneeId)
      } else {
        filtered = filtered.filter(task => task.assigneeId === assigneeFilter)
      }
    }

    // Initiative filter
    if (initiativeFilter !== 'all') {
      if (initiativeFilter === 'no-initiative') {
        filtered = filtered.filter(task => !task.initiativeId)
      } else {
        filtered = filtered.filter(
          task => task.initiativeId === initiativeFilter
        )
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(
        task => task.priority.toString() === priorityFilter
      )
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date()

      switch (dateRangeFilter) {
        case 'today':
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          )
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
          filtered = filtered.filter(task => {
            const taskCreatedAt = new Date(task.createdAt)
            return taskCreatedAt >= today && taskCreatedAt < tomorrow
          })
          break
        case 'this-week':
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          startOfWeek.setHours(0, 0, 0, 0)
          filtered = filtered.filter(task => {
            const taskCreatedAt = new Date(task.createdAt)
            return taskCreatedAt >= startOfWeek
          })
          break
        case 'this-month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          filtered = filtered.filter(task => {
            const taskCreatedAt = new Date(task.createdAt)
            return taskCreatedAt >= startOfMonth
          })
          break
        case 'last-30-days':
          const thirtyDaysAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000
          )
          filtered = filtered.filter(task => {
            const taskCreatedAt = new Date(task.createdAt)
            return taskCreatedAt >= thirtyDaysAgo
          })
          break
        case 'custom':
          if (startDate) {
            const startDateObj = new Date(startDate)
            startDateObj.setHours(0, 0, 0, 0)
            filtered = filtered.filter(task => {
              const taskCreatedAt = new Date(task.createdAt)
              return taskCreatedAt >= startDateObj
            })
          }
          if (endDate) {
            const endDateObj = new Date(endDate)
            endDateObj.setHours(23, 59, 59, 999)
            filtered = filtered.filter(task => {
              const taskCreatedAt = new Date(task.createdAt)
              return taskCreatedAt <= endDateObj
            })
          }
          break
      }
    }

    onFilteredTasksChange(filtered)

    // Save filter values to user settings
    saveFilters({
      textFilter,
      assigneeFilter,
      initiativeFilter,
      statusFilter,
      priorityFilter,
      dateRangeFilter,
      startDate,
      endDate,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tasks,
    textFilter,
    assigneeFilter,
    initiativeFilter,
    statusFilter,
    priorityFilter,
    dateRangeFilter,
    startDate,
    endDate,
  ])

  const clearFilters = () => {
    const defaultFilters = {
      textFilter: '',
      assigneeFilter: 'all',
      initiativeFilter: 'all',
      statusFilter: 'all',
      priorityFilter: 'all',
      dateRangeFilter: 'all',
      startDate: '',
      endDate: '',
    }

    setTextFilter(defaultFilters.textFilter)
    setAssigneeFilter(defaultFilters.assigneeFilter)
    setInitiativeFilter(defaultFilters.initiativeFilter)
    setStatusFilter(defaultFilters.statusFilter)
    setPriorityFilter(defaultFilters.priorityFilter)
    setDateRangeFilter(defaultFilters.dateRangeFilter)
    setStartDate(defaultFilters.startDate)
    setEndDate(defaultFilters.endDate)

    // Save cleared filters to user settings
    saveFilters(defaultFilters)
  }

  const hasActiveFilters =
    textFilter.trim() ||
    assigneeFilter !== 'all' ||
    initiativeFilter !== 'all' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    dateRangeFilter !== 'all'

  return (
    <div className='space-y-4 px-3 md:px-0'>
      {/* Search and Filter Bar */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            placeholder='Search tasks...'
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
                  <label className='text-sm font-medium'>Assignee</label>
                  <Select
                    value={assigneeFilter}
                    onValueChange={setAssigneeFilter}
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
                  <Select
                    value={initiativeFilter}
                    onValueChange={setInitiativeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='All initiatives' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All initiatives</SelectItem>
                      <SelectItem value='no-initiative'>
                        No initiative
                      </SelectItem>
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
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
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
                  <label className='text-sm font-medium'>Date Range</label>
                  <Select
                    value={dateRangeFilter}
                    onValueChange={setDateRangeFilter}
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
              </div>

              {/* Custom Date Range Inputs */}
              {dateRangeFilter === 'custom' && (
                <div className='grid grid-cols-2 gap-4 mt-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Start Date</label>
                    <Input
                      type='date'
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>End Date</label>
                    <Input
                      type='date'
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
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
