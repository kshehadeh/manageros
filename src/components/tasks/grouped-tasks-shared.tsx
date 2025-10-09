'use client'

import { useState, useEffect, useMemo } from 'react'
import { TaskTable } from '@/components/tasks/task-table'
import { TasksFilterBar } from '@/components/tasks/tasks-filter-bar'
import type { TaskListItem } from '@/lib/task-list-select'
import type { Person, Initiative } from '@prisma/client'
import { TaskStatus, taskStatusUtils } from '@/lib/task-status'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Group,
  User as UserIcon,
  Target,
  ChevronLeft,
  ChevronRight,
  List,
  Search,
} from 'lucide-react'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_SORT_ORDER: TaskStatus[] = [
  'todo',
  'doing',
  'blocked',
  'done',
  'dropped',
]

const STATUS_ORDER_RANK = STATUS_SORT_ORDER.reduce<Record<string, number>>(
  (acc, status, index) => {
    acc[status] = index
    return acc
  },
  {}
)

type GroupingOption = 'status' | 'initiative' | 'assignee' | 'none'

interface TaskGroup {
  key: string
  label: string
  tasks: TaskListItem[]
  count: number
}

interface GroupedTasksSharedProps {
  tasks: TaskListItem[]
  people: Person[]
  initiatives: Initiative[]
  loading: boolean
  error: string | null
  onRefetch: () => void
  pagination?: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  onPageChange: (_page: number) => void
  showOnlyMyTasks?: boolean
  onSearchChange?: (_search: string) => void
  searchValue?: string
  excludeCompleted?: boolean
  onExcludeCompletedChange?: (_exclude: boolean) => void
  onFiltersChange?: (_filters: {
    search: string
    status: string
    assigneeId: string
    initiativeId: string
    priority: string
    dueDateFrom: string
    dueDateTo: string
  }) => void
}

export function GroupedTasksShared({
  tasks,
  people,
  initiatives,
  loading,
  error,
  onRefetch,
  pagination,
  onPageChange,
  showOnlyMyTasks = false,
  onSearchChange,
  searchValue = '',
  excludeCompleted = false,
  onExcludeCompletedChange,
  onFiltersChange,
}: GroupedTasksSharedProps) {
  const { getSetting, updateSetting, isLoaded } = useUserSettings()
  const [groupingOption, setGroupingOption] = useState<GroupingOption>('status')

  // Load grouping option from user settings
  useEffect(() => {
    if (isLoaded) {
      const savedGrouping = getSetting('taskGrouping')
      setGroupingOption(savedGrouping)
    }
  }, [isLoaded, getSetting])

  // Group tasks based on the selected option
  const groupedTasks = useMemo(() => {
    const groups: TaskGroup[] = []

    switch (groupingOption) {
      case 'none':
        // No grouping - show all tasks in a single group
        if (tasks.length > 0) {
          groups.push({
            key: 'all-tasks',
            label: 'All Tasks',
            tasks: tasks.sort((a, b) => {
              // Sort by status priority, then due date, then priority
              const aStatusIndex =
                STATUS_ORDER_RANK[a.status as TaskStatus] ??
                STATUS_SORT_ORDER.length
              const bStatusIndex =
                STATUS_ORDER_RANK[b.status as TaskStatus] ??
                STATUS_SORT_ORDER.length

              if (aStatusIndex !== bStatusIndex) {
                return aStatusIndex - bStatusIndex
              }

              const aDueDate = a.dueDate
                ? new Date(a.dueDate).getTime()
                : Number.MAX_SAFE_INTEGER
              const bDueDate = b.dueDate
                ? new Date(b.dueDate).getTime()
                : Number.MAX_SAFE_INTEGER

              if (aDueDate !== bDueDate) {
                return aDueDate - bDueDate
              }

              return b.priority - a.priority
            }),
            count: tasks.length,
          })
        }
        break
      case 'status':
        // Group by task status
        const statusGroups = new Map<string, TaskListItem[]>()

        tasks.forEach(task => {
          const status = task.status as TaskStatus
          if (!statusGroups.has(status)) {
            statusGroups.set(status, [])
          }
          statusGroups.get(status)!.push(task)
        })

        // Create groups in a specific order
        STATUS_SORT_ORDER.forEach(status => {
          const tasks = statusGroups.get(status) || []
          if (tasks.length > 0) {
            groups.push({
              key: status,
              label: taskStatusUtils.getLabel(status),
              tasks: tasks.sort((a, b) => {
                // Sort by due date (desc) then priority (desc)
                const aDueDate = a.dueDate
                  ? new Date(a.dueDate).getTime()
                  : Number.MAX_SAFE_INTEGER
                const bDueDate = b.dueDate
                  ? new Date(b.dueDate).getTime()
                  : Number.MAX_SAFE_INTEGER

                if (aDueDate !== bDueDate) {
                  return bDueDate - aDueDate
                }
                return b.priority - a.priority
              }),
              count: tasks.length,
            })
          }
        })
        break

      case 'initiative':
        // Group by initiative
        const initiativeGroups = new Map<string, TaskListItem[]>()

        tasks.forEach(task => {
          const key = task.initiative?.id || 'no-initiative'
          if (!initiativeGroups.has(key)) {
            initiativeGroups.set(key, [])
          }
          initiativeGroups.get(key)!.push(task)
        })

        // Create groups
        initiativeGroups.forEach((tasks, key) => {
          const initiative = initiatives.find(i => i.id === key)
          groups.push({
            key,
            label: initiative?.title || 'No Initiative',
            tasks: tasks.sort((a, b) => {
              // Sort by status priority, then due date, then priority
              const aStatusIndex =
                STATUS_ORDER_RANK[a.status as TaskStatus] ??
                STATUS_SORT_ORDER.length
              const bStatusIndex =
                STATUS_ORDER_RANK[b.status as TaskStatus] ??
                STATUS_SORT_ORDER.length

              if (aStatusIndex !== bStatusIndex) {
                return aStatusIndex - bStatusIndex
              }

              const aDueDate = a.dueDate
                ? new Date(a.dueDate).getTime()
                : Number.MAX_SAFE_INTEGER
              const bDueDate = b.dueDate
                ? new Date(b.dueDate).getTime()
                : Number.MAX_SAFE_INTEGER

              if (aDueDate !== bDueDate) {
                return aDueDate - bDueDate
              }

              return b.priority - a.priority
            }),
            count: tasks.length,
          })
        })

        // Sort groups by initiative title
        groups.sort((a, b) => {
          if (a.key === 'no-initiative') return 1
          if (b.key === 'no-initiative') return -1
          return a.label.localeCompare(b.label)
        })
        break

      case 'assignee':
        // Group by assignee
        const assigneeGroups = new Map<string, TaskListItem[]>()

        tasks.forEach(task => {
          const key = task.assignee?.id || 'unassigned'
          if (!assigneeGroups.has(key)) {
            assigneeGroups.set(key, [])
          }
          assigneeGroups.get(key)!.push(task)
        })

        // Create groups
        assigneeGroups.forEach((tasks, key) => {
          const person = people.find(p => p.id === key)
          groups.push({
            key,
            label: person?.name || 'Unassigned',
            tasks: tasks.sort((a, b) => {
              // Sort by status priority, then due date, then priority
              const aStatusIndex =
                STATUS_ORDER_RANK[a.status as TaskStatus] ??
                STATUS_SORT_ORDER.length
              const bStatusIndex =
                STATUS_ORDER_RANK[b.status as TaskStatus] ??
                STATUS_SORT_ORDER.length

              if (aStatusIndex !== bStatusIndex) {
                return aStatusIndex - bStatusIndex
              }

              const aDueDate = a.dueDate
                ? new Date(a.dueDate).getTime()
                : Number.MAX_SAFE_INTEGER
              const bDueDate = b.dueDate
                ? new Date(b.dueDate).getTime()
                : Number.MAX_SAFE_INTEGER

              if (aDueDate !== bDueDate) {
                return aDueDate - bDueDate
              }

              return b.priority - a.priority
            }),
            count: tasks.length,
          })
        })

        // Sort groups by person name
        groups.sort((a, b) => {
          if (a.key === 'unassigned') return 1
          if (b.key === 'unassigned') return -1
          return a.label.localeCompare(b.label)
        })
        break
    }

    return groups
  }, [tasks, groupingOption, initiatives, people])

  const getGroupIcon = (option: GroupingOption) => {
    switch (option) {
      case 'status':
        return <Group className='h-4 w-4' />
      case 'initiative':
        return <Target className='h-4 w-4' />
      case 'assignee':
        return <UserIcon className='h-4 w-4' />
      case 'none':
        return <List className='h-4 w-4' />
    }
  }

  const getGroupBadgeVariant = (group: TaskGroup) => {
    if (groupingOption === 'status') {
      const status = group.key as TaskStatus
      return taskStatusUtils.getUIVariant(status)
    }
    return 'neutral'
  }

  return (
    <div className='space-y-6'>
      {/* Filter and Grouping Controls */}
      <div className='space-y-4 px-0'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          {/* Filter Bar - only show for regular tasks view */}
          {!showOnlyMyTasks && onFiltersChange && (
            <div className='flex-1'>
              <TasksFilterBar
                tasks={tasks}
                people={people}
                initiatives={initiatives}
                onFilteredTasksChange={onFiltersChange}
              />
            </div>
          )}

          {/* Search Input - only for My Tasks view */}
          {showOnlyMyTasks && onSearchChange && (
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search my tasks...'
                  value={searchValue}
                  onChange={e => onSearchChange(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
          )}

          {/* Controls - grouping and completed tasks toggle */}
          <div className='flex items-center gap-4 lg:flex-shrink-0'>
            {/* Completed Tasks Toggle - only for My Tasks view */}
            {showOnlyMyTasks && onExcludeCompletedChange && (
              <div className='flex items-center gap-2'>
                <Label
                  htmlFor='exclude-completed'
                  className='text-sm font-medium text-muted-foreground'
                >
                  Hide completed
                </Label>
                <Switch
                  id='exclude-completed'
                  checked={excludeCompleted}
                  onCheckedChange={checked => {
                    onExcludeCompletedChange(checked)
                    // Save setting for My Tasks view
                    if (showOnlyMyTasks) {
                      updateSetting('myTasksHideCompleted', checked)
                    }
                  }}
                />
              </div>
            )}
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
                  updateSetting('taskGrouping', value)
                }}
              >
                <SelectTrigger id='grouping-select' className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>
                    <div className='flex items-center gap-2'>
                      <List className='h-4 w-4' />
                      No Grouping
                    </div>
                  </SelectItem>
                  <SelectItem value='status'>
                    <div className='flex items-center gap-2'>
                      <Group className='h-4 w-4' />
                      Status
                    </div>
                  </SelectItem>
                  <SelectItem value='initiative'>
                    <div className='flex items-center gap-2'>
                      <Target className='h-4 w-4' />
                      Initiative
                    </div>
                  </SelectItem>
                  <SelectItem value='assignee'>
                    <div className='flex items-center gap-2'>
                      <UserIcon className='h-4 w-4' />
                      Assignee
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='text-sm text-muted-foreground'>
              {pagination ? (
                <>
                  {pagination.totalCount} task
                  {pagination.totalCount !== 1 ? 's' : ''}
                  {groupingOption !== 'none' && (
                    <>
                      {' '}
                      in {groupedTasks.length} group
                      {groupedTasks.length !== 1 ? 's' : ''}
                    </>
                  )}
                </>
              ) : (
                <>
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                  {groupingOption !== 'none' && (
                    <>
                      {' '}
                      in {groupedTasks.length} group
                      {groupedTasks.length !== 1 ? 's' : ''}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className='space-y-6'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-6 w-32' />
                <Skeleton className='h-6 w-8' />
              </div>
              <div className='space-y-2'>
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className='h-12 w-full' />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className='text-center py-12'>
          <p className='text-destructive mb-4'>Error loading tasks: {error}</p>
          <Button onClick={onRefetch} variant='outline'>
            Try Again
          </Button>
        </div>
      )}

      {/* Grouped Tasks */}
      {!loading && !error && (
        <div className='space-y-6'>
          {groupedTasks.map(group => (
            <div key={group.key} className='space-y-4'>
              {groupingOption !== 'none' && (
                <div className='flex items-center justify-between px-0'>
                  <div className='flex items-center gap-3'>
                    {getGroupIcon(groupingOption)}
                    <h3 className='text-lg font-semibold'>{group.label}</h3>
                    <Badge variant={getGroupBadgeVariant(group)}>
                      {group.count}
                    </Badge>
                  </div>
                </div>
              )}
              <TaskTable
                tasks={group.tasks}
                people={people}
                initiatives={initiatives}
                hideFilters={true}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && pagination && pagination.totalPages > 1 && (
        <div className='flex items-center justify-between px-0'>
          <div className='text-sm text-muted-foreground'>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(
              pagination.page * pagination.limit,
              pagination.totalCount
            )}{' '}
            of {pagination.totalCount} tasks
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
            >
              <ChevronLeft className='h-4 w-4' />
              Previous
            </Button>
            <div className='flex items-center gap-1'>
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const pageNum =
                    Math.max(
                      1,
                      Math.min(pagination.totalPages - 4, pagination.page - 2)
                    ) + i

                  if (pageNum > pagination.totalPages) return null

                  return (
                    <Button
                      key={pageNum}
                      variant={
                        pageNum === pagination.page ? 'default' : 'outline'
                      }
                      size='sm'
                      onClick={() => onPageChange(pageNum)}
                      className='w-8 h-8 p-0'
                    >
                      {pageNum}
                    </Button>
                  )
                }
              )}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && groupedTasks.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>
            No tasks found matching your filters.
          </p>
        </div>
      )}
    </div>
  )
}
