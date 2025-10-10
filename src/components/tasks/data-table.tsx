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
  X,
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
}
import { TaskQuickEditDialog } from '@/components/tasks/task-quick-edit-dialog'
import { DeleteModal } from '@/components/common/delete-modal'
import { createTaskColumns } from './columns'
import { useSession } from 'next-auth/react'
import { useTasks } from '@/hooks/use-tasks'
import { usePeopleCache } from '@/hooks/use-organization-cache'
import { useTaskTableSettings } from '@/hooks/use-task-table-settings'

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
  onTaskUpdate,
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
  const [showFilters, setShowFilters] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // Use settings hook for persistent state
  const { settings, updateSorting, updateGrouping, updateFilters } =
    useTaskTableSettings({
      settingsId: settingsId || 'default',
      enabled: !!settingsId,
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
    filters: settings.filters,
    immutableFilters,
    enabled: shouldFetch,
  })

  // Reset searching state when API call completes
  useEffect(() => {
    if (!loading && isSearching) {
      setIsSearching(false)
    }
  }, [loading, isSearching])

  const { people } = usePeopleCache()

  const tasks = useMemo(() => tasksData?.tasks || [], [tasksData?.tasks])

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    return (
      settings.filters.search !== '' ||
      settings.filters.status !== '' ||
      settings.filters.priority !== '' ||
      settings.filters.assigneeId !== '' ||
      settings.filters.initiativeId !== '' ||
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
    enableSizing: true,
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
    globalFilterFn,
    manualPagination: enablePagination, // Use server-side pagination when enabled
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

  // Handle clicking outside context menu to close it
  const _handleClickOutside = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [])

  // Handle clicking outside filter popup to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Don't close if clicking inside the filter popup
      if (filterRef.current && filterRef.current.contains(target)) {
        return
      }

      // Don't close if clicking on Radix Select elements (they use portals)
      const isRadixSelectElement =
        target instanceof Element &&
        (target.closest('[data-radix-select-content]') ||
          target.closest('[data-radix-select-trigger]') ||
          target.closest('[data-radix-select-item]') ||
          target.closest('[data-radix-select-viewport]') ||
          target.closest('[data-radix-select-scroll-up-button]') ||
          target.closest('[data-radix-select-scroll-down-button]'))

      if (isRadixSelectElement) {
        return
      }

      setShowFilters(false)
    }

    if (showFilters) {
      // Use mousedown but with proper Radix Select detection
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilters])

  // Don't show loading screen - keep current results visible while searching

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

              {/* Grouping Dropdown */}
              <div className='flex items-center gap-2'>
                <label className='text-sm font-medium whitespace-nowrap'>
                  Group by:
                </label>
                <Select
                  value={settings.grouping}
                  onValueChange={updateGrouping}
                >
                  <SelectTrigger className='w-32'>
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

              {/* Additional Filters Button */}
              <div className='relative' ref={filterRef}>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowFilters(!showFilters)}
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

                {/* Filter Popup */}
                {showFilters && (
                  <div className='absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-lg p-4 z-50'>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <h3 className='font-medium'>Filter Tasks</h3>
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={() => {
                              setGlobalFilter('')
                              setColumnFilters([])
                              setSearchInput('')
                              updateFilters({
                                search: '',
                                status: '',
                                assigneeId: '',
                                initiativeId: '',
                                priority: '',
                                dueDateFrom: '',
                                dueDateTo: '',
                              })
                            }}
                            className='text-sm text-muted-foreground hover:text-foreground'
                          >
                            Clear all
                          </button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setShowFilters(false)}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>

                      <div className='space-y-4'>
                        {/* Status Filter */}
                        <div className='space-y-2'>
                          <label className='text-sm font-medium'>Status</label>
                          <Select
                            value={settings.filters.status || 'all'}
                            onValueChange={value =>
                              updateFilters({
                                status: value === 'all' ? '' : value,
                              })
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
                          <label className='text-sm font-medium'>
                            Priority
                          </label>
                          <Select
                            value={settings.filters.priority || 'all'}
                            onValueChange={value =>
                              updateFilters({
                                priority: value === 'all' ? '' : value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='All priorities' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='all'>
                                All priorities
                              </SelectItem>
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
                    </div>
                  </div>
                )}
              </div>
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
                    header =>
                      !(header.column.columnDef.meta as ColumnMeta)?.hidden
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
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.filter(col => !(col.meta as ColumnMeta)?.hidden)
                      .length
                  }
                  className='h-24 text-center'
                >
                  <div className='flex items-center justify-center gap-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                    Loading tasks...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                    data-state={row.getIsSelected() && 'selected'}
                    className='hover:bg-accent/50 cursor-pointer'
                    onDoubleClick={() => handleRowDoubleClick(row.original.id)}
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
