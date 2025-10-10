'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  useReactTable,
  GroupingState,
  SortingState,
  ColumnFiltersState,
  ExpandedState,
  PaginationState,
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
} from 'lucide-react'
import { updateTaskStatus, deleteTask } from '@/lib/actions/task'
import {
  taskStatusUtils,
  type TaskStatus,
  TASK_STATUS,
  ALL_TASK_STATUSES,
} from '@/lib/task-status'
import { taskPriorityUtils, type TaskPriority } from '@/lib/task-priority'
import { toast } from 'sonner'
import type { Person, Initiative } from '@prisma/client'
import type { TaskListItem } from '@/lib/task-list-select'
import type { CachedPerson } from '@/lib/stores/organization-cache-store'
import { TaskQuickEditDialog } from '@/components/tasks/task-quick-edit-dialog'
import { DeleteModal } from '@/components/common/delete-modal'
import { createTaskColumns } from './columns'
import { useSession } from 'next-auth/react'
import { useTasks } from '@/hooks/use-tasks'
import { usePeopleCache } from '@/hooks/use-organization-cache'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  taskId: string
  triggerType: 'rightClick' | 'button'
}

interface TaskDataTableProps {
  grouping?: GroupingState
  onTaskUpdate?: () => void
  hideFilters?: boolean
  showOnlyMyTasks?: boolean
  // Pagination options
  page?: number
  limit?: number
  enablePagination?: boolean
  // Legacy props for backward compatibility (now ignored)
  tasks?: TaskListItem[]
  people?: Person[]
  initiatives?: Initiative[]
}

// Global filter function for search
const globalFilterFn = (
  row: { original: TaskListItem },
  columnId: string,
  value: string
) => {
  const task = row.original
  const searchValue = value.toLowerCase()

  return (
    task.title.toLowerCase().includes(searchValue) ||
    task.description?.toLowerCase().includes(searchValue) ||
    task.assignee?.name.toLowerCase().includes(searchValue) ||
    task.initiative?.title.toLowerCase().includes(searchValue) ||
    false
  )
}

export function TaskDataTable({
  grouping = [],
  onTaskUpdate,
  hideFilters = false,
  showOnlyMyTasks = false,
  page: _page = 1,
  limit = 20,
  enablePagination = false,
  // Legacy props (ignored)
  tasks: _tasks,
  people: _people,
  initiatives: _initiatives,
}: TaskDataTableProps) {
  const router = useRouter()
  const [_updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set()) // Only used for delete operations
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Internal filter state - managed by the component
  const [internalFilters, setInternalFilters] = useState({
    search: '',
    status: '',
    assigneeId: '',
    initiativeId: '',
    priority: '',
    dueDateFrom: '',
    dueDateTo: '',
  })
  const hasExpandedGroups = useRef(false)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: limit,
  })

  // Set initial sorting for status grouping
  useEffect(() => {
    if (grouping.includes('status') && sorting.length === 0) {
      setSorting([{ id: 'status', desc: false }])
    }
  }, [grouping, sorting.length])

  // Get current user's personId for my tasks filtering
  const { data: session } = useSession()
  const personId = session?.user?.personId

  // Determine immutable filters based on showOnlyMyTasks
  const immutableFilters = useMemo(() => {
    return showOnlyMyTasks && personId ? { assigneeId: personId } : {}
  }, [showOnlyMyTasks, personId])

  // Fetch data using single useTasks hook with internal filters
  const {
    data: tasksData,
    loading,
    error,
    refetch,
    updateTask,
  } = useTasks({
    page: enablePagination ? pagination.pageIndex + 1 : 1,
    limit: enablePagination ? pagination.pageSize : 1000,
    filters: internalFilters,
    immutableFilters,
  })

  const { people } = usePeopleCache()

  const tasks = useMemo(() => tasksData?.tasks || [], [tasksData?.tasks])

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    taskId: '',
    triggerType: 'rightClick',
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [quickEditDialog, setQuickEditDialog] = useState<{
    open: boolean
    taskId: string | null
  }>({
    open: false,
    taskId: null,
  })

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

  const handleDeleteConfirm = async (taskId: string) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId))

    try {
      await deleteTask(taskId)
      toast.success('Task deleted successfully')
      await refetch()
      onTaskUpdate?.()
    } catch (error) {
      console.error('Failed to delete task:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete task'
      )
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const handleRowDoubleClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`)
  }

  const handleButtonClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      visible: true,
      x: rect.right - 160,
      y: rect.bottom + 4,
      taskId,
      triggerType: 'button',
    })
  }

  const handleQuickEdit = (taskId: string) => {
    setQuickEditDialog({
      open: true,
      taskId,
    })
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const getGroupLabel = (groupValue: string, groupingColumn: string) => {
    switch (groupingColumn) {
      case 'status':
        return taskStatusUtils.getLabel(groupValue as TaskStatus)
      case 'assignee':
        const person = people?.find((p: CachedPerson) => p.id === groupValue)
        return person?.name || 'Unassigned'
      case 'initiative':
        // For now, just return the group value since we don't have initiatives cache
        return groupValue || 'No Initiative'
      default:
        return groupValue
    }
  }

  const columns = createTaskColumns({
    onTaskComplete: handleTaskComplete,
    onButtonClick: handleButtonClick,
    enableSizing: true,
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
      globalFilter,
      pagination: enablePagination ? pagination : undefined,
    },
    initialState: {
      expanded: true, // Expand all groups by default
    },
    onGroupingChange: () => {}, // Controlled by parent
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: enablePagination ? setPagination : undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    enableGrouping: true,
    globalFilterFn,
    manualPagination: enablePagination, // Use server-side pagination when enabled
  })

  // Expand all groups by default when table is ready
  useEffect(() => {
    if (grouping.length > 0 && !hasExpandedGroups.current) {
      const rowModel = table.getRowModel()
      if (rowModel.rows.length > 0) {
        // Find all group rows and expand them
        const groupRows = rowModel.rows.filter(row => row.getIsGrouped())
        if (groupRows.length > 0) {
          const expandedState: Record<string, boolean> = {}
          groupRows.forEach(row => {
            expandedState[row.id] = true
          })
          setExpanded(expandedState)
          hasExpandedGroups.current = true
        }
      }
    }
  }, [grouping.length, table])

  // Handle clicking outside context menu to close it
  const _handleClickOutside = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [])

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
    <div className='space-y-4'>
      {/* Filter Controls */}
      {!hideFilters && (
        <div>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-2 flex-1'>
              {/* Search Input - Always visible */}
              <div className='relative flex-1 max-w-sm'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search tasks...'
                  value={internalFilters.search}
                  onChange={e =>
                    setInternalFilters(prev => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                  className='pl-8'
                />
              </div>

              {/* Additional Filters Button */}
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
                {columnFilters.length > 0 && (
                  <div className='h-2 w-2 bg-primary rounded-full' />
                )}
              </Button>
            </div>
            <div className='text-sm text-muted-foreground'>
              {enablePagination && tasksData?.pagination ? (
                <>
                  Showing{' '}
                  {(tasksData.pagination.page - 1) *
                    tasksData.pagination.limit +
                    1}{' '}
                  to{' '}
                  {Math.min(
                    tasksData.pagination.page * tasksData.pagination.limit,
                    tasksData.pagination.totalCount
                  )}{' '}
                  of {tasksData.pagination.totalCount} tasks
                </>
              ) : (
                <>
                  Showing {table.getFilteredRowModel().rows.length} of{' '}
                  {tasks.length} tasks
                </>
              )}
            </div>
          </div>

          {showFilters && (
            <div className='border border-t-0 rounded-b-lg rounded-t-none p-4 bg-muted/30'>
              <div className='space-y-4'>
                {/* Column Filters */}
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                  {/* Status Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Status</label>
                    <Select
                      value={internalFilters.status || 'all'}
                      onValueChange={value =>
                        setInternalFilters(prev => ({
                          ...prev,
                          status: value === 'all' ? '' : value,
                        }))
                      }
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

                  {/* Priority Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Priority</label>
                    <Select
                      value={internalFilters.priority || 'all'}
                      onValueChange={value =>
                        setInternalFilters(prev => ({
                          ...prev,
                          priority: value === 'all' ? '' : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All priorities' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All priorities</SelectItem>
                        {[1, 2, 3, 4, 5].map(priority => (
                          <SelectItem
                            key={priority}
                            value={priority.toString()}
                          >
                            {taskPriorityUtils.getLabel(
                              priority as TaskPriority
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className='flex justify-end'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setGlobalFilter('')
                      setColumnFilters([])
                      setInternalFilters({
                        search: '',
                        status: '',
                        assigneeId: '',
                        initiativeId: '',
                        priority: '',
                        dueDateFrom: '',
                        dueDateTo: '',
                      })
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Table */}
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
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
                      >
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
                          columns.filter(col => !(col.meta as any)?.hidden)
                            .length
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
                            {getGroupLabel(
                              row.getValue(row.groupingColumnId!),
                              row.groupingColumnId!
                            )}
                          </span>
                          <Badge variant='secondary'>
                            {row.subRows.length}
                          </Badge>
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
                    className='hover:bg-accent/50 cursor-pointer'
                    onDoubleClick={() => handleRowDoubleClick(row.original.id)}
                  >
                    {row
                      .getVisibleCells()
                      .filter(
                        cell => !(cell.column.columnDef.meta as any)?.hidden
                      )
                      .map(cell => (
                        <TableCell
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                        >
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

      {/* Pagination Controls */}
      {enablePagination && tasksData?.pagination && (
        <div className='flex items-center justify-between px-2'>
          <div className='flex-1 text-sm text-muted-foreground'>
            Page {tasksData.pagination.page} of{' '}
            {tasksData.pagination.totalPages}
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                setPagination(prev => ({
                  ...prev,
                  pageIndex: prev.pageIndex - 1,
                }))
              }}
              disabled={!tasksData.pagination.hasPreviousPage}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                setPagination(prev => ({
                  ...prev,
                  pageIndex: prev.pageIndex + 1,
                }))
              }}
              disabled={!tasksData.pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className='fixed z-50 bg-popover text-popover-foreground border rounded-md shadow-lg py-1 min-w-[160px]'
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
            onClick={() => {
              router.push(`/tasks/${contextMenu.taskId}`)
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Eye className='w-4 h-4' />
            View
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
            onClick={() => {
              handleQuickEdit(contextMenu.taskId)
            }}
          >
            <Edit className='w-4 h-4' />
            Quick Edit
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center gap-2'
            onClick={() => {
              setContextMenu(prev => ({ ...prev, visible: false }))
              setDeleteTargetId(contextMenu.taskId)
              setShowDeleteModal(true)
            }}
          >
            <Trash2 className='w-4 h-4' />
            Delete
          </button>
        </div>
      )}

      {/* Quick Edit Dialog */}
      {quickEditDialog.open &&
        quickEditDialog.taskId &&
        (() => {
          const task = tasks.find(
            (t: TaskListItem) => t.id === quickEditDialog.taskId
          )!
          return (
            <TaskQuickEditDialog
              open={quickEditDialog.open}
              onOpenChange={open => setQuickEditDialog({ open, taskId: null })}
              task={{
                id: task.id,
                title: task.title,
                description: task.description,
                assigneeId: task.assigneeId,
                dueDate: task.dueDate,
                priority: task.priority,
                status: task.status as TaskStatus,
              }}
              people={
                (people || []).map(p => ({
                  id: p.id,
                  name: p.name,
                  email: p.email,
                  role: p.role,
                  avatar: p.avatar,
                  status: p.status,
                  organizationId: p.organizationId,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  birthday: null,
                  employeeType: null,
                  teamId: null,
                  managerId: null,
                  jobRoleId: null,
                  startedAt: null,
                })) as Person[]
              }
              onTaskUpdate={async () => {
                await refetch()
                onTaskUpdate?.()
              }}
            />
          )
        })()}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTargetId(null)
        }}
        onConfirm={() => {
          if (deleteTargetId) {
            return handleDeleteConfirm(deleteTargetId)
          }
        }}
        title='Delete Task'
        entityName='task'
      />
    </div>
  )
}
