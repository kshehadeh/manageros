'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Group,
  ArrowUpDown,
  ChevronLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTeamsCache } from '@/hooks/use-organization-cache'
import { usePeople } from '@/hooks/use-people'
import { usePeopleTableSettings } from '@/hooks/use-people-table-settings'
import { createPeopleColumns } from './columns'
import { DeleteModal } from '@/components/common/delete-modal'
import { deletePerson } from '@/lib/actions/person'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import {
  ViewDetailsMenuItem,
  EditMenuItem,
  DeleteMenuItem,
} from '@/components/common/context-menu-items'

// Type for column meta
interface ColumnMeta {
  hidden?: boolean
  className?: string
}

interface PeopleDataTableProps {
  onPersonUpdate?: () => void
  hideFilters?: boolean
  settingsId?: string // Unique identifier for saving per-view settings
  // Pagination options
  page?: number
  limit?: number
  enablePagination?: boolean
  // Immutable filters that cannot be changed by user interaction
  immutableFilters?: {
    search?: string
    teamId?: string
    managerId?: string
    jobRoleId?: string
    status?: string
  }
}

// Global filter function for search
const globalFilterFn = (
  row: {
    original: { name: string; email: string | null; role: string | null }
  },
  _columnId: string,
  value: string
): boolean => {
  const lowerValue = value.toLowerCase()
  return (
    row.original.name?.toLowerCase().includes(lowerValue) ||
    false ||
    row.original.email?.toLowerCase().includes(lowerValue) ||
    false ||
    row.original.role?.toLowerCase().includes(lowerValue) ||
    false
  )
}

export function PeopleDataTable({
  onPersonUpdate: _onPersonUpdate,
  hideFilters = false,
  settingsId,
  limit = 20,
  enablePagination = false,
  immutableFilters,
}: PeopleDataTableProps) {
  const router = useRouter()
  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  // Use settings hook for persistent state
  const { settings, updateSorting, updateGrouping, updateSort, updateFilters } =
    usePeopleTableSettings({
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

  // Set initial sorting for team grouping
  useEffect(() => {
    if (effectiveGrouping.includes('team') && settings.sorting.length === 0) {
      updateSorting([{ id: 'team', desc: false }])
    }
  }, [effectiveGrouping, settings.sorting.length, updateSorting])

  // Get current user's session
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

  // Fetch data using single usePeople hook with internal filters
  const {
    data: peopleData,
    loading,
    error,
    refetch,
  } = usePeople({
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

  const { teams } = useTeamsCache()

  const people = useMemo(() => peopleData?.people || [], [peopleData?.people])

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    return Object.values(settings.filters).some(
      value => value !== '' && value !== 'all'
    )
  }, [settings.filters])

  // Helper function to format group labels
  const getGroupLabel = (groupValue: string, groupingColumn: string) => {
    switch (groupingColumn) {
      case 'team':
        return groupValue || 'No Team'
      case 'manager':
        return groupValue || 'No Manager'
      case 'jobRole':
        return groupValue || 'No Job Role'
      case 'status':
        return groupValue
      default:
        return groupValue
    }
  }

  const handleDeleteClick = (personId: string) => {
    setDeleteTargetId(personId)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return

    try {
      await deletePerson(deleteTargetId)
      toast.success('Person deleted successfully')
      setShowDeleteModal(false)
      setDeleteTargetId(null)
      await refetch()
    } catch (error) {
      console.error('Failed to delete person:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete person'
      )
    }
  }

  const handleRowClick = (personId: string) => {
    router.push(`/people/${personId}`)
  }

  const columns = createPeopleColumns({
    onButtonClick: handleButtonClick,
    grouping: effectiveGrouping,
  })

  const table = useReactTable({
    data: people,
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
    manualPagination: enablePagination, // Use server-side pagination
    pageCount:
      enablePagination && peopleData?.pagination
        ? peopleData.pagination.totalPages
        : undefined,
  })

  // Expand all groups by default when table is ready
  useEffect(() => {
    if (effectiveGrouping.length > 0 && !hasExpandedGroups.current) {
      const rowModel = table.getRowModel()
      if (rowModel.rows.length > 0) {
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
        <div className='text-destructive'>Error loading people: {error}</div>
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
                  placeholder='Search people...'
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
                      <h3 className='font-medium'>Filter People</h3>
                      <button
                        onClick={() => {
                          setGlobalFilter('')
                          setColumnFilters([])
                          setSearchInput('')
                          updateFilters({
                            search: '',
                            teamId: '',
                            managerId: '',
                            jobRoleId: '',
                            status: '',
                          })
                        }}
                        className='text-sm text-muted-foreground hover:text-foreground'
                      >
                        Clear all
                      </button>
                    </div>

                    <div className='space-y-4'>
                      {/* Team Filter */}
                      <div className='space-y-2'>
                        <label className='text-sm font-medium'>Team</label>
                        <Select
                          value={settings.filters.teamId || 'all'}
                          onValueChange={value =>
                            updateFilters({
                              teamId: value === 'all' ? '' : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='All teams' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='all'>All teams</SelectItem>
                            <SelectItem value='no-team'>No Team</SelectItem>
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

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
                            <SelectItem value='active'>Active</SelectItem>
                            <SelectItem value='inactive'>Inactive</SelectItem>
                            <SelectItem value='on_leave'>On Leave</SelectItem>
                            <SelectItem value='terminated'>
                              Terminated
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                          <SelectItem value='team'>Team</SelectItem>
                          <SelectItem value='manager'>Manager</SelectItem>
                          <SelectItem value='jobRole'>Job Role</SelectItem>
                          <SelectItem value='status'>Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Group people by team, manager, job role, or status</p>
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
                      <h3 className='font-medium'>Sort People</h3>
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
                            <SelectItem value='name'>Name</SelectItem>
                            <SelectItem value='email'>Email</SelectItem>
                            <SelectItem value='team'>Team</SelectItem>
                            <SelectItem value='manager'>Manager</SelectItem>
                            <SelectItem value='status'>Status</SelectItem>
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
              {enablePagination && peopleData?.pagination ? (
                <>
                  {peopleData.pagination.totalCount > 0 ? (
                    <>
                      Showing{' '}
                      {(peopleData.pagination.page - 1) *
                        peopleData.pagination.limit +
                        1}{' '}
                      to{' '}
                      {Math.min(
                        peopleData.pagination.page *
                          peopleData.pagination.limit,
                        peopleData.pagination.totalCount
                      )}{' '}
                      of {peopleData.pagination.totalCount} people
                    </>
                  ) : (
                    'No people found'
                  )}
                </>
              ) : (
                `${people.length} ${people.length === 1 ? 'person' : 'people'}`
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className='rounded-md border overflow-hidden'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const meta = header.column.columnDef.meta as
                    | ColumnMeta
                    | undefined
                  if (meta?.hidden) return null

                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width: header.column.getSize(),
                      }}
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
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  <div className='flex items-center justify-center'>
                    <div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => {
                if (row.getIsGrouped()) {
                  // Group header row
                  const groupingColumnId = effectiveGrouping[0]
                  const groupingValue = row.getGroupingValue(groupingColumnId)
                  const groupLabel = getGroupLabel(
                    String(groupingValue),
                    groupingColumnId
                  )

                  return (
                    <TableRow key={row.id} className='bg-muted/50'>
                      <TableCell
                        colSpan={
                          columns.filter(c => !(c.meta as ColumnMeta)?.hidden)
                            .length
                        }
                        className='font-medium py-3'
                      >
                        <button
                          onClick={() => row.toggleExpanded()}
                          className='flex items-center gap-2 hover:text-primary transition-colors w-full'
                        >
                          {row.getIsExpanded() ? (
                            <ChevronDown className='h-4 w-4' />
                          ) : (
                            <ChevronRight className='h-4 w-4' />
                          )}
                          <span>{groupLabel}</span>
                          <Badge variant='outline' className='ml-2'>
                            {row.subRows.length}
                          </Badge>
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                }

                // Regular data row
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => handleRowClick(row.original.id)}
                    className='cursor-pointer hover:bg-muted/50 transition-colors'
                  >
                    {row.getVisibleCells().map(cell => {
                      const meta = cell.column.columnDef.meta as
                        | ColumnMeta
                        | undefined
                      if (meta?.hidden) return null

                      return (
                        <TableCell
                          key={cell.id}
                          style={{
                            width: cell.column.getSize(),
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No people found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {enablePagination && peopleData?.pagination && (
        <div className='flex items-center justify-between px-2'>
          <div className='flex-1 text-sm text-muted-foreground'>
            Page {peopleData.pagination.page} of{' '}
            {peopleData.pagination.totalPages}
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className='h-4 w-4' />
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => (
          <>
            <ViewDetailsMenuItem
              entityId={entityId}
              entityType='people'
              close={close}
            />
            <EditMenuItem
              entityId={entityId}
              entityType='people'
              close={close}
            />
            <DeleteMenuItem
              onDelete={() => handleDeleteClick(entityId)}
              close={close}
            />
          </>
        )}
      </ContextMenuComponent>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTargetId(null)
        }}
        onConfirm={handleDeleteConfirm}
        title='Delete Person'
        description='Are you sure you want to delete this person? This action cannot be undone.'
      />
    </div>
  )
}
