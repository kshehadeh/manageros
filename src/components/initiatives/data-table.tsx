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
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Group,
  ArrowUpDown,
  ChevronLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { deleteInitiative } from '@/lib/actions/initiative'
import { usePeopleCache, useTeamsCache } from '@/hooks/use-organization-cache'
import { useInitiatives } from '@/hooks/use-initiatives'
import { useInitiativeTableSettings } from '@/hooks/use-initiative-table-settings'
import { createInitiativeColumns } from './columns'
import { DeleteModal } from '@/components/common/delete-modal'

// Type for column meta
interface ColumnMeta {
  hidden?: boolean
  className?: string
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  initiativeId: string
  triggerType: 'rightClick' | 'button'
}

interface InitiativeDataTableProps {
  onInitiativeUpdate?: () => void
  hideFilters?: boolean
  settingsId?: string // Unique identifier for saving per-view settings
  // Pagination options
  page?: number
  limit?: number
  enablePagination?: boolean
  // Column visibility options
  visibleColumns?: string[] // Array of column IDs to show (if not provided, all columns are shown)
  // Immutable filters that cannot be changed by user interaction
  immutableFilters?: {
    search?: string
    teamId?: string
    ownerId?: string
    rag?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }
}

export function InitiativeDataTable({
  onInitiativeUpdate: _onInitiativeUpdate,
  hideFilters = false,
  settingsId,
  limit = 20,
  enablePagination = false,
  visibleColumns,
  immutableFilters,
}: InitiativeDataTableProps) {
  const router = useRouter()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    initiativeId: '',
    triggerType: 'rightClick',
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  // Use settings hook for persistent state
  const { settings, updateSorting, updateGrouping, updateSort, updateFilters } =
    useInitiativeTableSettings({
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

  // Set initial sorting for rag grouping
  useEffect(() => {
    if (effectiveGrouping.includes('rag') && settings.sorting.length === 0) {
      updateSorting([{ id: 'rag', desc: false }])
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

  // Fetch data using single useInitiatives hook with internal filters
  const {
    data: initiativesData,
    loading,
    isInitialLoad,
    error,
    refetch,
  } = useInitiatives({
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

  const { people } = usePeopleCache()
  const { teams } = useTeamsCache()

  const initiatives = useMemo(
    () => initiativesData?.initiatives || [],
    [initiativesData?.initiatives]
  )

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    return Object.values(settings.filters).some(
      value => value !== '' && value !== 'all'
    )
  }, [settings.filters])

  // Helper function to format group labels
  const getGroupLabel = (groupValue: string, groupingColumn: string) => {
    switch (groupingColumn) {
      case 'status':
        return groupValue
      case 'team':
        return groupValue || 'No Team'
      case 'owner':
        return groupValue || 'Unassigned'
      case 'rag':
        return groupValue.charAt(0).toUpperCase() + groupValue.slice(1)
      default:
        return groupValue
    }
  }

  // Handle context menu actions
  const handleDeleteConfirm = async (initiativeId: string) => {
    try {
      await deleteInitiative(initiativeId)
      toast.success('Initiative deleted successfully')
      refetch()
    } catch (error) {
      console.error('Failed to delete initiative:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete initiative'
      )
    }
  }

  const handleRowClick = (initiativeId: string) => {
    router.push(`/initiatives/${initiativeId}`)
  }

  const handleContextMenuButtonClick = (
    e: React.MouseEvent,
    initiativeId: string
  ) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setContextMenu({
      visible: true,
      x: rect.left,
      y: rect.bottom + 5,
      initiativeId,
      triggerType: 'button',
    })
  }

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(prev => ({ ...prev, visible: false }))
    }

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.visible])

  // Create columns
  const columns = useMemo(
    () =>
      createInitiativeColumns({
        onButtonClick: handleContextMenuButtonClick,
        grouping: effectiveGrouping,
        visibleColumns,
      }),
    [effectiveGrouping, visibleColumns]
  )

  const table = useReactTable({
    data: initiatives,
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
    manualPagination: enablePagination, // Use server-side pagination
    pageCount:
      enablePagination && initiativesData?.pagination
        ? initiativesData.pagination.totalPages
        : undefined,
  })

  // Expand all groups by default when table is ready
  useEffect(() => {
    if (
      !loading &&
      initiatives.length > 0 &&
      effectiveGrouping.length > 0 &&
      !hasExpandedGroups.current
    ) {
      table.toggleAllRowsExpanded(true)
      hasExpandedGroups.current = true
    }
  }, [loading, initiatives.length, effectiveGrouping.length, table])

  // Reset expanded groups flag when grouping changes
  useEffect(() => {
    hasExpandedGroups.current = false
  }, [settings.grouping])

  if (error) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-center'>
          <p className='text-destructive font-medium'>
            Error loading initiatives
          </p>
          <p className='text-sm text-muted-foreground mt-1'>{error}</p>
          <Button onClick={refetch} variant='outline' className='mt-4'>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Filters Section */}
      {!hideFilters && (
        <div className='flex flex-col gap-4'>
          {/* Top Row - Search and Filter Toggle */}
          <div className='flex items-center gap-2'>
            <div className='relative flex-1 max-w-sm'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search initiatives...'
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className='pl-8'
                disabled={loading || isSearching}
              />
              {isSearching && (
                <div className='absolute right-2 top-2.5'>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                </div>
              )}
            </div>

            {/* Controls Row */}
            <div className='flex items-center gap-2'>
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
                          <SelectItem value='rag'>RAG</SelectItem>
                          <SelectItem value='owner'>Owner</SelectItem>
                          <SelectItem value='status'>Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Group initiatives by team, RAG, owner, or status</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Sort Control */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'
                  >
                    <ArrowUpDown className='h-4 w-4' />
                    Sort
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-64'>
                  <div className='space-y-4'>
                    <div>
                      <label className='text-sm font-medium'>Sort by</label>
                      <Select
                        value={settings.sort.field}
                        onValueChange={field =>
                          updateSort({
                            field,
                            direction: settings.sort.direction,
                          })
                        }
                      >
                        <SelectTrigger className='mt-1'>
                          <SelectValue placeholder='Select field' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='title'>Title</SelectItem>
                          <SelectItem value='status'>Status</SelectItem>
                          <SelectItem value='rag'>RAG</SelectItem>
                          <SelectItem value='team'>Team</SelectItem>
                          <SelectItem value='targetDate'>
                            Target Date
                          </SelectItem>
                          <SelectItem value='updatedAt'>
                            Last Updated
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Direction</label>
                      <Select
                        value={settings.sort.direction}
                        onValueChange={direction =>
                          updateSort({
                            field: settings.sort.field,
                            direction: direction as 'asc' | 'desc',
                          })
                        }
                      >
                        <SelectTrigger className='mt-1'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='asc'>Ascending</SelectItem>
                          <SelectItem value='desc'>Descending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Filter Button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'
                  >
                    <Filter className='h-4 w-4' />
                    Filters
                    {hasActiveFilters && (
                      <div className='h-2 w-2 bg-primary rounded-full' />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-80'>
                  <div className='space-y-4'>
                    <div className='font-medium'>Filter Initiatives</div>

                    {/* Team Filter */}
                    {!immutableFilters?.teamId && (
                      <div>
                        <label className='text-sm font-medium'>Team</label>
                        <Select
                          value={settings.filters.teamId || 'all'}
                          onValueChange={value =>
                            updateFilters({
                              teamId: value === 'all' ? '' : value,
                            })
                          }
                        >
                          <SelectTrigger className='mt-1'>
                            <SelectValue placeholder='All teams' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='all'>All teams</SelectItem>
                            <SelectItem value='no-team'>No team</SelectItem>
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Owner Filter */}
                    {!immutableFilters?.ownerId && (
                      <div>
                        <label className='text-sm font-medium'>Owner</label>
                        <Select
                          value={settings.filters.ownerId || 'all'}
                          onValueChange={value =>
                            updateFilters({
                              ownerId: value === 'all' ? '' : value,
                            })
                          }
                        >
                          <SelectTrigger className='mt-1'>
                            <SelectValue placeholder='All owners' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='all'>All owners</SelectItem>
                            {people.map(person => (
                              <SelectItem key={person.id} value={person.id}>
                                {person.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* RAG Filter */}
                    {!immutableFilters?.rag && (
                      <div>
                        <label className='text-sm font-medium'>
                          RAG Status
                        </label>
                        <Select
                          value={settings.filters.rag || 'all'}
                          onValueChange={value =>
                            updateFilters({ rag: value === 'all' ? '' : value })
                          }
                        >
                          <SelectTrigger className='mt-1'>
                            <SelectValue placeholder='All RAG statuses' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='all'>
                              All RAG statuses
                            </SelectItem>
                            <SelectItem value='red'>Red</SelectItem>
                            <SelectItem value='amber'>Amber</SelectItem>
                            <SelectItem value='green'>Green</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Status Filter */}
                    {!immutableFilters?.status && (
                      <div>
                        <label className='text-sm font-medium'>Status</label>
                        <Select
                          value={settings.filters.status || 'all'}
                          onValueChange={value =>
                            updateFilters({
                              status: value === 'all' ? '' : value,
                            })
                          }
                        >
                          <SelectTrigger className='mt-1'>
                            <SelectValue placeholder='All statuses' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='all'>All statuses</SelectItem>
                            <SelectItem value='planned'>Planned</SelectItem>
                            <SelectItem value='active'>Active</SelectItem>
                            <SelectItem value='completed'>Completed</SelectItem>
                            <SelectItem value='on-hold'>On Hold</SelectItem>
                            <SelectItem value='canceled'>Canceled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          updateFilters({
                            search: '',
                            teamId: '',
                            ownerId: '',
                            rag: '',
                            status: '',
                            dateFrom: '',
                            dateTo: '',
                          })
                        }
                        className='w-full'
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Results Count */}
          <div className='text-sm text-muted-foreground'>
            {isInitialLoad && loading
              ? 'Loading...'
              : `Showing ${initiatives.length} ${
                  initiatives.length === 1 ? 'initiative' : 'initiatives'
                }${
                  initiativesData?.pagination
                    ? ` of ${initiativesData.pagination.totalCount} total`
                    : ''
                }`}
          </div>
        </div>
      )}

      {/* Table */}
      <div className='rounded-md border relative'>
        {/* Loading Spinner in top right corner */}
        {loading && (
          <div className='absolute top-2 right-2 z-10 bg-background/80 rounded-full p-2'>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
          </div>
        )}
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
                      colSpan={header.colSpan}
                      style={{
                        width: header.getSize(),
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
            {isInitialLoad && loading ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.filter(c => {
                      const meta = c.meta as ColumnMeta | undefined
                      return !meta?.hidden
                    }).length
                  }
                  className='h-24 text-center'
                >
                  <div className='flex items-center justify-center'>
                    <div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                    <span className='ml-2 text-sm text-muted-foreground'>
                      Loading initiatives...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => {
                if (row.getIsGrouped()) {
                  // Group header row
                  return (
                    <TableRow
                      key={row.id}
                      className='bg-muted/50 hover:bg-muted'
                    >
                      <TableCell
                        colSpan={
                          columns.filter(c => {
                            const meta = c.meta as ColumnMeta | undefined
                            return !meta?.hidden
                          }).length
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

                // Regular initiative row
                return (
                  <TableRow
                    key={row.id}
                    className='hover:bg-accent/50 cursor-pointer'
                    onClick={() => handleRowClick(row.original.id)}
                  >
                    {row
                      .getVisibleCells()
                      .filter(cell => {
                        const meta = cell.column.columnDef.meta as
                          | ColumnMeta
                          | undefined
                        return !meta?.hidden
                      })
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
                    columns.filter(c => {
                      const meta = c.meta as ColumnMeta | undefined
                      return !meta?.hidden
                    }).length
                  }
                  className='h-24 text-center'
                >
                  {hasActiveFilters
                    ? 'No initiatives found matching your filters.'
                    : 'No initiatives yet.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {enablePagination && initiativesData?.pagination && (
        <div className='flex items-center justify-between'>
          <div className='text-sm text-muted-foreground'>
            Page {initiativesData.pagination.page} of{' '}
            {initiativesData.pagination.totalPages}
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.previousPage()}
              disabled={
                !initiativesData.pagination.hasPreviousPage ||
                (isInitialLoad && loading)
              }
            >
              <ChevronLeft className='h-4 w-4' />
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.nextPage()}
              disabled={
                !initiativesData.pagination.hasNextPage ||
                (isInitialLoad && loading)
              }
            >
              Next
              <ChevronRight className='h-4 w-4' />
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
              router.push(`/initiatives/${contextMenu.initiativeId}`)
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Eye className='w-4 h-4' />
            View
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
            onClick={() => {
              router.push(`/initiatives/${contextMenu.initiativeId}/edit`)
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Edit className='w-4 h-4' />
            Edit
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center gap-2'
            onClick={() => {
              setContextMenu(prev => ({ ...prev, visible: false }))
              setDeleteTargetId(contextMenu.initiativeId)
              setShowDeleteModal(true)
            }}
          >
            <Trash2 className='w-4 h-4' />
            Delete
          </button>
        </div>
      )}

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
        title='Delete Initiative'
        entityName='initiative'
      />
    </div>
  )
}
