'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge, BadgeVariant } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MoreHorizontal,
  User as UserIcon,
  Calendar,
  Target,
  Flag,
} from 'lucide-react'
import {
  taskStatusUtils,
  type TaskStatus,
  TASK_STATUS,
  ALL_TASK_STATUSES,
} from '@/lib/task-status'
import { taskPriorityUtils, type TaskPriority } from '@/lib/task-priority'
import type { ExtendedTaskListItem } from '@/lib/task-list-select'
import { useTasks } from '@/hooks/use-tasks'
import { useTaskTableSettings } from '@/hooks/use-task-table-settings'
import { deleteTask, updateTaskStatus } from '@/lib/actions/task'
import type { DataTableConfig } from '@/components/common/generic-data-table'
import {
  ViewDetailsMenuItem,
  EditMenuItem,
  DeleteMenuItem,
  MarkAsDoneMenuItem,
} from '@/components/common/context-menu-items'
import { toast } from 'sonner'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'

type TaskFilters = {
  search?: string
  status?: string[]
  assigneeId?: string[]
  initiativeId?: string[]
  priority?: string[]
  dueDateFrom?: string
  dueDateTo?: string
}

export const taskDataTableConfig: DataTableConfig<
  ExtendedTaskListItem,
  TaskFilters
> = {
  // Entity identification
  entityType: 'task',
  entityName: 'Task',
  entityNamePlural: 'Tasks',

  // Data fetching
  useDataHook: useTasks,

  // Settings management
  useSettingsHook: useTaskTableSettings,

  // Additional props passed to columns
  columnProps: {},

  onRowClick: (router, taskId) => {
    router.push(`/tasks/${taskId}`)
  },

  // Column definitions
  createColumns: ({
    onButtonClick,
    visibleColumns,
    refetch,
    applyOptimisticUpdate,
    removeOptimisticUpdate,
    grouping,
  }) => {
    const getPriorityVariant = (priority: number) => {
      return taskPriorityUtils.getVariant(priority as TaskPriority)
    }

    const getPriorityLabel = (priority: number) => {
      return taskPriorityUtils.getLabel(priority as TaskPriority)
    }

    // Check which column is being grouped by to hide it
    const isGroupedByAssignee = grouping && grouping.includes('assignee')
    const isGroupedByStatus = grouping && grouping.includes('status')
    const isGroupedByPriority = grouping && grouping.includes('priority')
    const isGroupedByInitiative = grouping && grouping.includes('initiative')
    const isGroupedByDueDate = grouping && grouping.includes('dueDate')

    const handleCheckboxToggle = async (
      taskId: string,
      currentStatus: string
    ) => {
      const newStatus =
        currentStatus === TASK_STATUS.DONE ? TASK_STATUS.TODO : TASK_STATUS.DONE

      // Apply optimistic update immediately
      applyOptimisticUpdate(taskId, { status: newStatus })

      try {
        await updateTaskStatus(taskId, newStatus)
        toast.success(
          `Task marked as ${taskStatusUtils.getLabel(newStatus as TaskStatus)}`
        )
        // Refetch to ensure data consistency - optimistic update will be cleared automatically
        refetch?.()
      } catch (error) {
        console.error('Failed to update task status:', error)
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to update task status'
        )
        // Remove optimistic update on error to revert the UI
        removeOptimisticUpdate(taskId)
      }
    }

    return [
      {
        accessorKey: 'title',
        header: 'Summary',
        size: 500,
        minSize: 300,
        maxSize: 1000,
        cell: ({ row }) => {
          const task = row.original
          const isDone = task.status === TASK_STATUS.DONE

          return (
            <div className='flex items-start gap-3 space-y-0.5 flex-1'>
              <Checkbox
                checked={isDone}
                onCheckedChange={() =>
                  handleCheckboxToggle(task.id, task.status)
                }
                onClick={e => e.stopPropagation()}
                className='mt-0.5'
              />
              <div className='space-y-0.5 flex-1'>
                <div className='font-medium'>{task.title}</div>
                {task.description && (
                  <div className='line-clamp-2'>
                    <ReadonlyNotesField
                      content={task.description}
                      variant='compact'
                      showEmptyState={false}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        },
        meta: {
          hidden: visibleColumns?.includes('title') === false,
        },
      },
      {
        id: 'assignee',
        header: () => (
          <div className='flex items-center gap-2'>
            <UserIcon className='h-4 w-4' />
            Assignee
          </div>
        ),
        accessorFn: row => row.assignee?.name || 'Unassigned',
        cell: ({ row }) => {
          const task = row.original
          if (!task.assignee) {
            return <span className='text-muted-foreground'>Unassigned</span>
          }
          return (
            <Link
              href={`/people/${task.assignee.id}`}
              className='text-primary hover:text-primary/90 transition-colors'
              onClick={e => e.stopPropagation()}
            >
              {task.assignee.name}
            </Link>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden:
            visibleColumns?.includes('assignee') === false ||
            isGroupedByAssignee,
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const task = row.original
          const statusInfo = taskStatusUtils.getVariant(
            task.status as TaskStatus
          )
          return (
            <Badge variant={statusInfo as BadgeVariant}>
              {taskStatusUtils.getLabel(task.status as TaskStatus)}
            </Badge>
          )
        },
        sortingFn: (rowA, rowB, columnId) => {
          const statusA = rowA.getValue(columnId) as TaskStatus
          const statusB = rowB.getValue(columnId) as TaskStatus

          const orderA = taskStatusUtils.getSortOrder(statusA)
          const orderB = taskStatusUtils.getSortOrder(statusB)

          return orderA - orderB
        },
        size: 120,
        minSize: 100,
        maxSize: 150,
        meta: {
          hidden:
            visibleColumns?.includes('status') === false || isGroupedByStatus,
        },
      },
      {
        id: 'priority',
        header: () => (
          <div className='flex items-center gap-2'>
            <Flag className='h-4 w-4' />
            Priority
          </div>
        ),
        accessorKey: 'priority',
        cell: ({ row }) => {
          const task = row.original
          const variant = getPriorityVariant(task.priority)
          const label = getPriorityLabel(task.priority)
          return <Badge variant={variant as BadgeVariant}>{label}</Badge>
        },
        size: 100,
        minSize: 80,
        maxSize: 120,
        meta: {
          hidden:
            visibleColumns?.includes('priority') === false ||
            isGroupedByPriority,
        },
      },
      {
        id: 'initiative',
        header: () => (
          <div className='flex items-center gap-2'>
            <Target className='h-4 w-4' />
            Initiative
          </div>
        ),
        accessorFn: row => row.initiative?.title || '—',
        cell: ({ row }) => {
          const task = row.original
          if (!task.initiative) {
            return <span className='text-muted-foreground'>—</span>
          }
          return (
            <Link
              href={`/initiatives/${task.initiative.id}`}
              className='text-primary hover:text-primary/90 transition-colors'
              onClick={e => e.stopPropagation()}
            >
              {task.initiative.title}
            </Link>
          )
        },
        size: 200,
        minSize: 150,
        maxSize: 300,
        meta: {
          hidden:
            visibleColumns?.includes('initiative') === false ||
            isGroupedByInitiative,
        },
      },
      {
        id: 'dueDate',
        header: () => (
          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            Due Date
          </div>
        ),
        accessorKey: 'dueDate',
        cell: ({ row }) => {
          const task = row.original
          if (!task.dueDate) {
            return <span className='text-muted-foreground'>—</span>
          }
          return (
            <span className='text-muted-foreground'>
              {new Date(task.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )
        },
        size: 120,
        minSize: 100,
        maxSize: 150,
        meta: {
          hidden:
            visibleColumns?.includes('dueDate') === false || isGroupedByDueDate,
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const task = row.original
          return (
            <div className='flex items-center justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={e => {
                  e.stopPropagation()
                  onButtonClick(e, task.id)
                }}
              >
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </div>
          )
        },
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableSorting: false,
        enableHiding: false,
        meta: {
          hidden: false,
        },
      },
    ]
  },

  // Actions
  deleteAction: deleteTask,

  // Custom context menu items
  contextMenuItems: ({ entityId, entity, close, refetch, onDelete }) => (
    <>
      <ViewDetailsMenuItem
        entityId={entityId}
        entityType='tasks'
        close={close}
      />
      <EditMenuItem entityId={entityId} entityType='tasks' close={close} />
      <MarkAsDoneMenuItem
        taskId={entityId}
        currentStatus={entity.status}
        close={close}
        onSuccess={refetch}
      />
      <DeleteMenuItem onDelete={onDelete} close={close} />
    </>
  ),

  // UI configuration
  searchPlaceholder: 'Search tasks...',
  emptyMessage: 'No tasks found',
  loadingMessage: 'Loading tasks...',

  // Grouping and sorting options
  groupingOptions: [
    { value: 'none', label: 'No grouping' },
    { value: 'assignee', label: 'Group by assignee' },
    { value: 'status', label: 'Group by status' },
    { value: 'priority', label: 'Group by priority' },
    { value: 'initiative', label: 'Group by initiative' },
    { value: 'dueDate', label: 'Group by due date' },
  ],
  sortOptions: [
    { value: 'title', label: 'Title' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'dueDate', label: 'Due Date' },
  ],

  // Filter configuration
  filterContent: ({ settings, updateFilters }) => (
    <div className='space-y-3'>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Status</label>
        <Select
          value={
            settings.filters.status && settings.filters.status.length > 0
              ? settings.filters.status[0]
              : 'all'
          }
          onValueChange={value => {
            if (value === 'all') {
              updateFilters({ status: [] })
            } else {
              updateFilters({ status: [value] })
            }
          }}
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
    </div>
  ),

  hasActiveFiltersFn: filters => {
    return (
      filters.search !== '' ||
      (filters.status && filters.status.length > 0) ||
      (filters.assigneeId && filters.assigneeId.length > 0) ||
      (filters.initiativeId && filters.initiativeId.length > 0) ||
      (filters.priority && filters.priority.length > 0) ||
      filters.dueDateFrom !== '' ||
      filters.dueDateTo !== ''
    )
  },

  clearFiltersFn: () => ({
    search: '',
    status: [],
    assigneeId: [],
    initiativeId: [],
    priority: [],
    dueDateFrom: '',
    dueDateTo: '',
  }),

  // Custom row className function
  getRowClassName: task => {
    return task.status === TASK_STATUS.DONE ? 'line-through opacity-60' : ''
  },

  // Group label formatting
  getGroupLabel: (groupValue: string, groupingColumn: string) => {
    if (groupingColumn === 'status') {
      return taskStatusUtils.getLabel(groupValue as TaskStatus)
    }
    return groupValue || 'Unassigned'
  },
}
