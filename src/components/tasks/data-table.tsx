'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Group,
  ArrowUpDown,
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
import type { ExtendedTaskListItem, TaskListItem } from '@/lib/task-list-select'

// Type for column meta
interface ColumnMeta {
  hidden?: boolean
  className?: string
}
import { TaskQuickEditDialog } from '@/components/tasks/task-quick-edit-dialog'
import { DeleteModal } from '@/components/common/delete-modal'
import { createTaskColumns } from './columns'
import { useSession } from 'next-auth/react'
import { useTasks } from '@/hooks/use-tasks'
import { usePeopleCache } from '@/hooks/use-organization-cache'
import { useTaskTableSettings } from '@/hooks/use-task-table-settings'
import { MultiSelect } from '@/components/ui/multi-select'
import { InitiativeMultiSelect } from '@/components/ui/initiative-multi-select'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  taskId: string
  triggerType: 'rightClick' | 'button'
}

interface TaskDataTableProps {
  onTaskUpdate?: () => void
  hideFilters?: boolean
  showOnlyMyTasks?: boolean
  settingsId?: string // Unique identifier for saving per-view settings
  // Pagination options
  page?: number
  limit?: number
  enablePagination?: boolean
  // Immutable filters that cannot be changed by user interaction
  immutableFilters?: {
    search?: string
    status?: string
    assigneeId?: string
    initiativeId?: string
    priority?: string // Priority as string (1=Critical, 2=High, 3=Medium, 4=Low, 5=Very Low)
    dueDateFrom?: string
    dueDateTo?: string
  }
  // Legacy props for backward compatibility (now ignored)
  tasks?: ExtendedTaskListItem[]
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
  onTaskUpdate: _onTaskUpdate,
  hideFilters = false,
  settingsId,
  limit = 20,
  enablePagination = false,
  immutableFilters,
}: TaskDataTableProps) {
  const router = useRouter()
  const [_updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set()) // Only used for delete operations
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  // Use settings hook for persistent state
  const { settings, updateSorting, updateGrouping, updateSort, updateFilters } =
    useTaskTableSettings({
      settingsId: settingsId || 'default',
      enabled: true,
    })

  // Debounced search state - separate from internal filters to prevent immediate API calls
  const [searchInput, setSearchInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const hasExpandedGroups = useRef(false)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: limit,
  })

  // Convert grouping option to Tanstack Table grouping state
  const effectiveGrouping = useMemo(() => {
    return settings.grouping === 'none' ? [] : [settings.grouping]
  }, [settings.grouping])

  // Set initial sorting for status grouping
  useEffect(() => {
    if (effectiveGrouping.includes('status') && settings.sorting.length === 0) {
      updateSorting([{ id: 'status', desc: false }])
    }
  }, [effectiveGrouping, settings.sorting.length, updateSorting])

  // Get current user's personId for my tasks filtering
  const { status: sessionStatus } = useSession()

  // Don't fetch data if we're waiting for session
  const shouldFetch = sessionStatus !== 'loading'

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== settings.filters.search) {
        setIsSearching(true)
        updateFilters({ search: searchInput })
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchInput, settings.filters.search, updateFilters])

  // Memoize filters to prevent unnecessary refetches
  const memoizedFilters = useMemo(
    () => settings.filters,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(settings.filters)]
  )

  const memoizedImmutableFilters = useMemo(
    () => immutableFilters || {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(immutableFilters)]
  )

  // Convert sort settings to API format (field:direction)
  const sortParam = useMemo(() => {
    if (!settings.sort || !settings.sort.field) return ''
    return `${settings.sort.field}:${settings.sort.direction}`
  }, [settings.sort])

  // Fetch data using single useTasks hook with internal filters
  // For server-side pagination, we pass the current page/size from TanStack Table state
  const {
    data: tasksData,
    loading,
    error,
    refetch,
    updateTask,
  } = useTasks({
    page: enablePagination ? pagination.pageIndex + 1 : 1,
    limit: enablePagination ? pagination.pageSize : 1000,
    filters: memoizedFilters,
    immutableFilters: memoizedImmutableFilters,
    sort: sortParam,
    enabled: shouldFetch,
  })

  // Reset searching state when API call completes
  useEffect(() => {
    if (!loading && isSearching) {
      setIsSearching(false)
    }
  }, [loading, isSearching])

  // Listen for task creation events to refresh the list
  useEffect(() => {
    const handleTaskCreated = () => {
      refetch()
    }

    window.addEventListener('task:created', handleTaskCreated)
    return () => window.removeEventListener('task:created', handleTaskCreated)
  }, [refetch])

  const { people } = usePeopleCache()

  const tasks = useMemo(() => tasksData?.tasks || [], [tasksData?.tasks])

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    const statusArray = Array.isArray(settings.filters.status)
      ? settings.filters.status
      : []
    const assigneeArray = Array.isArray(settings.filters.assigneeId)
      ? settings.filters.assigneeId
      : []
    const initiativeArray = Array.isArray(settings.filters.initiativeId)
      ? settings.filters.initiativeId
      : []
    const priorityArray = Array.isArray(settings.filters.priority)
      ? settings.filters.priority
      : []

    return (
      settings.filters.search !== '' ||
      statusArray.length > 0 ||
      priorityArray.length > 0 ||
      assigneeArray.length > 0 ||
      initiativeArray.length > 0 ||
      settings.filters.dueDateFrom !== '' ||
      settings.filters.dueDateTo !== ''
    )
  }, [settings.filters])

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
      // Don't call onTaskUpdate?.() here as it triggers a full refresh
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
      // Don't call onTaskUpdate?.() as refetch already updates the list
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

  const handleRowClick = (taskId: string) => {
    handleQuickEdit(taskId)
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
        // groupValue is now the assignee name from accessorFn
        return groupValue || 'Unassigned'
      case 'initiative':
        // groupValue is now the initiative title from accessorFn
        return groupValue || 'No Initiative'
      default:
        return groupValue
    }
  }

  const columns = createTaskColumns({
    onTaskComplete: handleTaskComplete,
    onButtonClick: handleButtonClick,
    grouping: effectiveGrouping,
  })

  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      grouping: effectiveGrouping,
      sorting: settings.sorting,
      columnFilters,
      expanded,
      globalFilter,
      pagination: enablePagination ? pagination : undefined,
    },
    initialState: {
      expanded: true, // Expand all groups by default
    },
    onGroupingChange: () => {}, // Controlled by parent
    onSortingChange: updaterOrValue => {
      const newSorting =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(settings.sorting)
          : updaterOrValue
      updateSorting(newSorting)
    },
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
    enableColumnResizing: false,
    globalFilterFn,
    manualPagination: enablePagination, // Use server-side pagination - TanStack manages state, we fetch data
    pageCount:
      enablePagination && tasksData?.pagination
        ? tasksData.pagination.totalPages
        : undefined, // Tell TanStack how many pages exist
  })

  // Expand all groups by default when table is ready
  useEffect(() => {
    if (effectiveGrouping.length > 0 && !hasExpandedGroups.current) {
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
  }, [effectiveGrouping.length, table])

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
              {/* Search Input - Hidden if immutable */}
              {!immutableFilters?.search && (
                <div className='relative flex-1 max-w-sm'>
                  <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search tasks...'
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className='pl-8'
                  />
                  {isSearching && (
                    <div className='absolute right-2 top-2.5'>
                      <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                    </div>
                  )}
                </div>
              )}

              {/* Additional Filters Button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className={`flex items-center gap-2 ${
                      hasActiveFilters ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <Filter className='h-4 w-4' />
                    Filters
                    {hasActiveFilters && (
                      <div className='h-2 w-2 bg-primary rounded-full' />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-80' align='end'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='font-medium'>Filter Tasks</h3>
                      <button
                        onClick={() => {
                          setGlobalFilter('')
                          setColumnFilters([])
                          setSearchInput('')
                          updateFilters({
                            search: '',
                            status: [],
                            assigneeId: [],
                            initiativeId: [],
                            priority: [],
                            dueDateFrom: '',
                            dueDateTo: '',
                          })
                        }}
                        className='text-sm text-muted-foreground hover:text-foreground'
                      >
                        Clear all
                      </button>
                    </div>

                    <div className='space-y-4'>
                      {/* Status Filter - Hidden if immutable */}
                      {!immutableFilters?.status && (
                        <div className='space-y-2'>
                          <label className='text-sm font-medium'>Status</label>
                          <MultiSelect
                            options={ALL_TASK_STATUSES.map(status => ({
                              label: taskStatusUtils.getLabel(status),
                              value: status,
                            }))}
                            selected={
                              Array.isArray(settings.filters.status)
                                ? settings.filters.status
                                : []
                            }
                            onChange={value => updateFilters({ status: value })}
                            placeholder='All statuses'
                          />
                        </div>
                      )}

                      {/* Priority Filter - Hidden if immutable */}
                      {!immutableFilters?.priority && (
                        <div className='space-y-2'>
                          <label className='text-sm font-medium'>
                            Priority
                          </label>
                          <MultiSelect
                            options={[1, 2, 3, 4, 5].map(priority => ({
                              label: taskPriorityUtils.getLabel(
                                priority as TaskPriority
                              ),
                              value: priority.toString(),
                            }))}
                            selected={
                              Array.isArray(settings.filters.priority)
                                ? settings.filters.priority
                                : []
                            }
                            onChange={value =>
                              updateFilters({ priority: value })
                            }
                            placeholder='All priorities'
                          />
                        </div>
                      )}

                      {/* Assignee Filter - Hidden if immutable */}
                      {!immutableFilters?.assigneeId && (
                        <div className='space-y-2'>
                          <label className='text-sm font-medium'>
                            Assignee
                          </label>
                          <MultiSelect
                            options={[
                              { label: 'Unassigned', value: 'unassigned' },
                              ...people.map(person => ({
                                label: person.name,
                                value: person.id,
                              })),
                            ]}
                            selected={
                              Array.isArray(settings.filters.assigneeId)
                                ? settings.filters.assigneeId
                                : []
                            }
                            onChange={value =>
                              updateFilters({ assigneeId: value })
                            }
                            placeholder='All assignees'
                          />
                        </div>
                      )}

                      {/* Initiative Filter - Hidden if immutable */}
                      {!immutableFilters?.initiativeId && (
                        <div className='space-y-2'>
                          <label className='text-sm font-medium'>
                            Initiative
                          </label>
                          <InitiativeMultiSelect
                            selected={
                              Array.isArray(settings.filters.initiativeId)
                                ? settings.filters.initiativeId
                                : []
                            }
                            onChange={value =>
                              updateFilters({ initiativeId: value })
                            }
                            placeholder='All initiatives'
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {/* Grouping Dropdown */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className='flex items-center gap-2'>
                      <Select
                        value={settings.grouping}
                        onValueChange={updateGrouping}
                      >
                        <SelectTrigger className='w-32'>
                          <Group className='h-4 w-4' />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='none'>None</SelectItem>
                          <SelectItem value='status'>Status</SelectItem>
                          <SelectItem value='assignee'>Assignee</SelectItem>
                          <SelectItem value='initiative'>Initiative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Group tasks by status, assignee, or initiative</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Sort Control */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className={`flex items-center gap-2 ${
                      settings.sort?.field ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <ArrowUpDown className='h-4 w-4' />
                    Sort
                    {settings.sort?.field && (
                      <div className='h-2 w-2 bg-primary rounded-full' />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-80' align='end'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='font-medium'>Sort Tasks</h3>
                      <button
                        onClick={() => {
                          updateSort({ field: '', direction: 'asc' })
                        }}
                        className='text-sm text-muted-foreground hover:text-foreground'
                      >
                        Clear
                      </button>
                    </div>

                    <div className='space-y-4'>
                      {/* Sort Field */}
                      <div className='space-y-2'>
                        <label className='text-sm font-medium'>Sort By</label>
                        <Select
                          value={settings.sort?.field || 'none'}
                          onValueChange={value =>
                            updateSort({
                              field: value === 'none' ? '' : value,
                              direction: settings.sort?.direction || 'asc',
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select field' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='none'>None</SelectItem>
                            <SelectItem value='duedate'>Due Date</SelectItem>
                            <SelectItem value='priority'>Priority</SelectItem>
                            <SelectItem value='assignee'>Assignee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sort Direction */}
                      <div className='space-y-2'>
                        <label className='text-sm font-medium'>Direction</label>
                        <Select
                          value={settings.sort?.direction || 'asc'}
                          onValueChange={value =>
                            updateSort({
                              field: settings.sort?.field || '',
                              direction: value as 'asc' | 'desc',
                            })
                          }
                          disabled={!settings.sort?.field}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='asc'>Ascending</SelectItem>
                            <SelectItem value='desc'>Descending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className='text-sm text-muted-foreground'>
              {enablePagination && tasksData?.pagination ? (
                <>
                  {tasksData.pagination.totalCount > 0 ? (
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
                    <>No tasks found</>
                  )}
                </>
              ) : (
                <>
                  Showing {table.getFilteredRowModel().rows.length} of{' '}
                  {tasks.length} tasks
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Table */}
      <div className='rounded-md border relative'>
        {/* Loading Spinner in top right corner */}
        {loading && (
          <div className='absolute top-2 right-2 z-10 bg-background/80 rounded-full p-2'>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
          </div>
        )}
        <Table className='table-fixed'>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers
                  .filter(
                    header =>
                      !(header.column.columnDef.meta as ColumnMeta)?.hidden
                  )
                  .map(header => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className={
                          (header.column.columnDef.meta as ColumnMeta)
                            ?.className || ''
                        }
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
                          columns.filter(
                            col => !(col.meta as ColumnMeta)?.hidden
                          ).length
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
                    className='hover:bg-accent/50 cursor-pointer'
                    onClick={() => handleRowClick(row.original.id)}
                  >
                    {row
                      .getVisibleCells()
                      .filter(
                        cell =>
                          !(cell.column.columnDef.meta as ColumnMeta)?.hidden
                      )
                      .map(cell => (
                        <TableCell
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className={
                            (cell.column.columnDef.meta as ColumnMeta)
                              ?.className || ''
                          }
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
                    columns.filter(col => !(col.meta as ColumnMeta)?.hidden)
                      .length
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
      {enablePagination && (
        <div className='flex items-center justify-between px-2'>
          <div className='flex items-center gap-4'>
            <div className='text-sm text-muted-foreground'>
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-muted-foreground'>
                Rows per page:
              </span>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={value => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className='h-8 w-[70px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 30, 50, 100].map(pageSize => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
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
              onTaskUpdate={updatedTaskData => {
                // Optimistically update the task in the local state
                // Convert dueDate string to Date if needed
                const taskUpdates = {
                  ...updatedTaskData,
                  dueDate: updatedTaskData.dueDate
                    ? typeof updatedTaskData.dueDate === 'string'
                      ? new Date(updatedTaskData.dueDate)
                      : updatedTaskData.dueDate
                    : null,
                }
                updateTask(task.id, taskUpdates)
                // Don't call onTaskUpdate?.() here as it triggers a full refresh
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
