'use client'

import React, { useState, useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
  GroupingState,
  SortingState,
  ColumnFiltersState,
  ExpandedState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { updateTaskStatus } from '@/lib/actions/task'
import { type TaskStatus, TASK_STATUS } from '@/lib/task-status'
import { toast } from 'sonner'
import type { TaskListItem } from '@/lib/task-list-select'
import { createTaskColumns } from './columns'
import { useSession } from 'next-auth/react'
import { useTasks } from '@/hooks/use-tasks'
import { usePeopleCache } from '@/hooks/use-organization-cache'

interface TaskTableProps {
  grouping?: GroupingState
  hideFilters?: boolean
  onTaskUpdate?: () => void
  showOnlyMyTasks?: boolean
  // Legacy props for backward compatibility
  showInitiative?: boolean
  showDueDate?: boolean
  // Pagination options
  page?: number
  limit?: number
  enablePagination?: boolean
  // Legacy props for backward compatibility (now ignored)
  tasks?: TaskListItem[]
  people?: any[]
  initiatives?: any[]
}

export function TaskTable({
  grouping = [],
  onTaskUpdate,
  showInitiative: _showInitiative,
  showDueDate: _showDueDate,
  showOnlyMyTasks = false,
  page = 1,
  limit = 20,
  enablePagination = false,
  // Legacy props (ignored)
  tasks: _tasks,
  people: _people,
  initiatives: _initiatives,
}: TaskTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})

  // Internal filter state - managed by the component
  const [internalFilters, _setInternalFilters] = useState({
    search: '',
    status: '',
    assigneeId: '',
    initiativeId: '',
    priority: '',
    dueDateFrom: '',
    dueDateTo: '',
  })

  // Get current user's personId for my tasks filtering
  const { data: session } = useSession()
  const personId = session?.user?.personId

  // Determine immutable filters based on showOnlyMyTasks
  const immutableFilters = useMemo(() => {
    return showOnlyMyTasks && personId ? { assigneeId: personId } : {}
  }, [showOnlyMyTasks, personId])

  // Fetch data
  const {
    data: tasksData,
    loading,
    error,
    refetch: _refetch,
    updateTask,
  } = useTasks({
    page: enablePagination ? page : 1,
    limit: enablePagination ? limit : 1000, // Large limit for non-paginated
    filters: internalFilters,
    immutableFilters,
  })

  const { people: _peopleData } = usePeopleCache()

  const tasks = useMemo(() => tasksData?.tasks || [], [tasksData?.tasks])

  const handleTaskComplete = async (
    taskId: string,
    currentStatus: TaskStatus
  ) => {
    const newStatus =
      currentStatus === TASK_STATUS.DONE ? TASK_STATUS.TODO : TASK_STATUS.DONE

    // Store the previous data for rollback
    const previousData = tasksData

    // Optimistically update the local data immediately
    updateTask(taskId, { status: newStatus })

    try {
      await updateTaskStatus(taskId, newStatus)
      toast.success(
        newStatus === TASK_STATUS.DONE
          ? 'Task marked as complete'
          : 'Task marked as incomplete'
      )
      onTaskUpdate?.()
    } catch (error) {
      console.error('Failed to update task status:', error)

      // Rollback to previous data on error
      if (previousData) {
        // Find the original task to restore its status
        const originalTask = previousData.tasks.find(task => task.id === taskId)
        if (originalTask) {
          updateTask(taskId, { status: originalTask.status })
        }
      }

      toast.error(
        error instanceof Error ? error.message : 'Failed to update task status'
      )
    }
  }

  const columns = createTaskColumns({
    onTaskComplete: handleTaskComplete,
    enableSizing: false,
    grouping,
  })

  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      grouping,
      sorting,
      columnFilters,
      expanded,
    },
    onGroupingChange: () => {}, // Controlled by parent
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableGrouping: true,
  })

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-muted-foreground'>Loading tasks...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-destructive'>Error loading tasks: {error}</div>
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers
                .filter(
                  header => !(header.column.columnDef.meta as any)?.hidden
                )
                .map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map(row => {
              if (row.getIsGrouped()) {
                // Group header row
                return (
                  <TableRow key={row.id} className='bg-muted/50'>
                    <TableCell
                      colSpan={
                        columns.filter(col => !(col.meta as any)?.hidden).length
                      }
                    >
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={row.getToggleExpandedHandler()}
                          className='h-6 w-6 p-0'
                        >
                          {row.getIsExpanded() ? (
                            <ChevronDown className='h-4 w-4' />
                          ) : (
                            <ChevronRight className='h-4 w-4' />
                          )}
                        </Button>
                        <span className='font-medium'>
                          {row.getValue(row.groupingColumnId!)}
                        </span>
                        <Badge variant='secondary'>{row.subRows.length}</Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              }

              // Regular task row
              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row
                    .getVisibleCells()
                    .filter(
                      cell => !(cell.column.columnDef.meta as any)?.hidden
                    )
                    .map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={
                  columns.filter(col => !(col.meta as any)?.hidden).length
                }
                className='h-24 text-center'
              >
                No tasks found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
