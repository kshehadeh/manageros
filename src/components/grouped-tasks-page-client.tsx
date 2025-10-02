'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { TaskTable } from '@/components/task-table'
import { TasksFilterBar } from '@/components/tasks-filter-bar'
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
import { Group, User as UserIcon, Target } from 'lucide-react'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

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

type GroupingOption = 'status' | 'initiative' | 'assignee'

interface GroupedTasksPageClientProps {
  tasks: TaskListItem[]
  people: Person[]
  initiatives: Initiative[]
}

interface TaskGroup {
  key: string
  label: string
  tasks: TaskListItem[]
  count: number
}

export function GroupedTasksPageClient({
  tasks,
  people,
  initiatives,
}: GroupedTasksPageClientProps) {
  const { getSetting, updateSetting, isLoaded } = useUserSettings()
  const [filteredTasks, setFilteredTasks] = useState<TaskListItem[]>(tasks)
  const [groupingOption, setGroupingOption] = useState<GroupingOption>('status')

  // Load grouping option from user settings
  useEffect(() => {
    if (isLoaded) {
      const savedGrouping = getSetting('taskGrouping')
      setGroupingOption(savedGrouping)
    }
  }, [isLoaded]) // Remove getSetting from dependencies to prevent infinite loop

  // Update filtered tasks when tasks prop changes
  useEffect(() => {
    setFilteredTasks(tasks)
  }, [tasks])

  const handleFilteredTasksChange = useCallback(
    (newFilteredTasks: TaskListItem[]) => {
      setFilteredTasks(newFilteredTasks)
    },
    []
  )

  // Group tasks based on the selected option
  const groupedTasks = useMemo(() => {
    const groups: TaskGroup[] = []

    switch (groupingOption) {
      case 'status':
        // Group by task status
        const statusGroups = new Map<string, TaskListItem[]>()

        filteredTasks.forEach(task => {
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

        filteredTasks.forEach(task => {
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

        filteredTasks.forEach(task => {
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
  }, [filteredTasks, groupingOption, initiatives, people])

  const getGroupIcon = (option: GroupingOption) => {
    switch (option) {
      case 'status':
        return <Group className='h-4 w-4' />
      case 'initiative':
        return <Target className='h-4 w-4' />
      case 'assignee':
        return <UserIcon className='h-4 w-4' />
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
      <div className='space-y-4 px-3 md:px-0'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          {/* Filter Bar */}
          <div className='flex-1'>
            <TasksFilterBar
              tasks={tasks}
              people={people}
              initiatives={initiatives}
              onFilteredTasksChange={handleFilteredTasksChange}
            />
          </div>

          {/* Grouping Controls - beside filter on large screens */}
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
                  updateSetting('taskGrouping', value)
                }}
              >
                <SelectTrigger id='grouping-select' className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}{' '}
              in {groupedTasks.length} group
              {groupedTasks.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Grouped Tasks */}
      <div className='space-y-6'>
        {groupedTasks.map(group => (
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
            <TaskTable
              tasks={group.tasks}
              people={people}
              initiatives={initiatives}
              hideFilters={true}
            />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {groupedTasks.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>
            No tasks found matching your filters.
          </p>
        </div>
      )}
    </div>
  )
}
