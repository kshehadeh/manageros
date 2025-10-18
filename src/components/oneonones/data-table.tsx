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
import { useOneOnOnes } from '@/hooks/use-oneonones'
import { useOneOnOneTableSettings } from '@/hooks/use-oneonone-table-settings'
import { createOneOnOneColumns } from './columns'
import { DeleteModal } from '@/components/common/delete-modal'
import { deleteOneOnOne } from '@/lib/actions/oneonone'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import {
  ViewDetailsMenuItem,
  EditMenuItem,
  DeleteMenuItem,
} from '@/components/common/context-menu-items'
import { dataTableStyles } from '@/components/common/data-table-styles'

// Type for column meta
interface ColumnMeta {
  hidden?: boolean
  className?: string
}

interface OneOnOneDataTableProps {
  onOneOnOneUpdate?: () => void
  hideFilters?: boolean
  settingsId?: string // Unique identifier for saving per-view settings
  // Pagination options
  page?: number
  limit?: number
  enablePagination?: boolean
  // Immutable filters that cannot be changed by user interaction
  immutableFilters?: {
    search?: string
    scheduledFrom?: string
    scheduledTo?: string
  }
}

export function OneOnOneDataTable({
  onOneOnOneUpdate: _onOneOnOneUpdate,
  hideFilters = false,
  settingsId,
  limit = 20,
  enablePagination = false,
  immutableFilters,
}: OneOnOneDataTableProps) {
  const router = useRouter()
  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  // Use settings hook for persistent state
  const { settings, updateSorting, updateGrouping, updateSort, updateFilters } =
    useOneOnOneTableSettings({
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

  // Set initial sorting for participant grouping
  useEffect(() => {
    if (effectiveGrouping.length > 0 && settings.sorting.length === 0) {
      updateSorting([{ id: effectiveGrouping[0], desc: false }])
    }
  }, [effectiveGrouping, settings.sorting.length, updateSorting])

  // Get current user's session
  const { data: session, status: sessionStatus } = useSession()

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

  // Fetch data using single useOneOnOnes hook with internal filters
  const {
    data: oneOnOnesData,
    loading,
    error,
    refetch,
  } = useOneOnOnes({
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

  const oneOnOnes = useMemo(
    () => oneOnOnesData?.oneOnOnes || [],
    [oneOnOnesData?.oneOnOnes]
  )

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    return Object.values(settings.filters).some(
      value => value !== '' && value !== 'all'
    )
  }, [settings.filters])

  // Helper function to format group labels
  const getGroupLabel = (groupValue: string) => {
    return groupValue
  }

  const handleDeleteConfirm = async (oneOnOneId: string) => {
    try {
      await deleteOneOnOne(oneOnOneId)
      toast.success('1:1 deleted successfully')
      await refetch()
    } catch (error) {
      console.error('Failed to delete 1:1:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete 1:1'
      )
    }
  }

  const handleRowClick = (oneOnOneId: string) => {
    router.push(`/oneonones/${oneOnOneId}`)
  }

  const columns = createOneOnOneColumns({
    onButtonClick: handleButtonClick,
    grouping: effectiveGrouping,
    currentUserId: session?.user?.id,
  })

  const table = useReactTable({
    data: oneOnOnes,
    columns,
    state: {
      columnFilters,
      sorting: settings.sorting,
      grouping: effectiveGrouping,
      expanded,
      globalFilter,
      ...(enablePagination && {
        pagination: {
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
        },
      }),
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: updaterOrValue => {
      const newSorting =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(settings.sorting)
          : updaterOrValue
      updateSorting(newSorting)
    },
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    ...(enablePagination && { getPaginationRowModel: getPaginationRowModel() }),
    manualPagination: enablePagination,
    pageCount: enablePagination
      ? Math.ceil(
          (oneOnOnesData?.pagination?.totalCount || 0) / pagination.pageSize
        )
      : undefined,
  })

  // Auto-expand all groups on initial load or when grouping changes
  useEffect(() => {
    if (effectiveGrouping.length > 0 && !hasExpandedGroups.current) {
      const expandedState: ExpandedState = {}
      table.getRowModel().rows.forEach(row => {
        if (row.getIsGrouped()) {
          expandedState[row.id] = true
        }
      })
      setExpanded(expandedState)
      hasExpandedGroups.current = true
    } else if (effectiveGrouping.length === 0) {
      hasExpandedGroups.current = false
      setExpanded({})
    }
  }, [effectiveGrouping, table])

  if (error) {
    return (
      <div className='rounded-md border border-destructive/50 bg-destructive/10 p-4'>
        <p className='text-sm text-destructive'>Error loading 1:1s: {error}</p>
      </div>
    )
  }

  return (
    <div className={dataTableStyles.container}>
      {/* Filters and Controls */}
      {!hideFilters && (
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          {/* Left side: Search and Filters */}
          <div className='flex flex-1 items-center gap-2'>
            {/* Search Input */}
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search 1:1s...'
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className='pl-9'
              />
              {isSearching && (
                <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                </div>
              )}
            </div>

            {/* Active Filters Indicator */}
            {hasActiveFilters && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        setSearchInput('')
                        updateFilters({
                          search: '',
                          scheduledFrom: '',
                          scheduledTo: '',
                        })
                      }}
                    >
                      <Filter className='h-4 w-4 mr-1' />
                      Clear Filters
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear all active filters</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Right side: Controls */}
          <div className='flex items-center gap-2'>
            {/* Grouping Selector */}
            <Select
              value={settings.grouping}
              onValueChange={value => {
                updateGrouping(value)
                hasExpandedGroups.current = false
              }}
            >
              <SelectTrigger className='w-[180px]'>
                <Group className='h-4 w-4 mr-2' />
                <SelectValue placeholder='Group by...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>No Grouping</SelectItem>
                <SelectItem value='manager'>Participant 1</SelectItem>
                <SelectItem value='report'>Participant 2</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' size='sm'>
                  <ArrowUpDown className='h-4 w-4 mr-2' />
                  Sort
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-64'>
                <div className='space-y-4'>
                  <h4 className='text-sm font-medium'>Sort By</h4>
                  <div className='space-y-2'>
                    <Select
                      value={settings.sort.field}
                      onValueChange={value => {
                        updateSort({
                          field: value,
                          direction: settings.sort.direction,
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select field' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='scheduledAt'>
                          Scheduled Date
                        </SelectItem>
                        <SelectItem value='manager'>Participant 1</SelectItem>
                        <SelectItem value='report'>Participant 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={settings.sort.direction}
                      onValueChange={value => {
                        updateSort({
                          field: settings.sort.field,
                          direction: value as 'asc' | 'desc',
                        })
                      }}
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
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={dataTableStyles.tableWrapperRelative}>
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
                      className={meta?.className}
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
            {(loading || sessionStatus === 'loading') &&
            oneOnOnes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className={dataTableStyles.body.emptyCell}
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => {
                const isGroupRow = row.getIsGrouped()

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => {
                      if (!isGroupRow) {
                        handleRowClick(row.original.id)
                      }
                    }}
                    className={
                      isGroupRow
                        ? 'bg-muted/50 hover:bg-muted font-medium'
                        : 'cursor-pointer hover:bg-muted/50'
                    }
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => {
                      const meta = cell.column.columnDef.meta as
                        | ColumnMeta
                        | undefined

                      // For group rows, render the first cell (which will be the grouped column)
                      if (isGroupRow) {
                        if (cellIndex !== 0) {
                          return null
                        }

                        return (
                          <TableCell
                            key={cell.id}
                            colSpan={
                              table.getAllColumns().filter(col => {
                                const colMeta = col.columnDef.meta as
                                  | ColumnMeta
                                  | undefined
                                return !colMeta?.hidden
                              }).length
                            }
                            className='cursor-pointer'
                            onClick={() => row.toggleExpanded()}
                          >
                            <div className='flex items-center gap-2'>
                              {row.getIsExpanded() ? (
                                <ChevronDown className='h-4 w-4' />
                              ) : (
                                <ChevronRight className='h-4 w-4' />
                              )}
                              <span>
                                {getGroupLabel(String(cell.getValue()))} (
                                {row.subRows.length})
                              </span>
                            </div>
                          </TableCell>
                        )
                      }

                      // For regular rows, hide columns marked as hidden
                      if (meta?.hidden) return null

                      return (
                        <TableCell key={cell.id}>
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
                  className={dataTableStyles.body.emptyCell}
                >
                  No 1:1s found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className='flex items-center justify-between px-2'>
          <div className='text-sm text-muted-foreground'>
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
            {Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              oneOnOnesData?.pagination?.totalCount || 0
            )}{' '}
            of {oneOnOnesData?.pagination?.totalCount || 0} 1:1s
          </div>
          <div className='flex items-center gap-2'>
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
              entityType='oneonones'
              close={close}
            />
            <EditMenuItem
              entityId={entityId}
              entityType='oneonones'
              close={close}
            />
            <DeleteMenuItem
              onDelete={() => {
                setDeleteTargetId(entityId)
                setShowDeleteModal(true)
              }}
              close={close}
            />
          </>
        )}
      </ContextMenuComponent>

      {/* Delete Modal */}
      {showDeleteModal && deleteTargetId && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setDeleteTargetId(null)
          }}
          onConfirm={() => {
            handleDeleteConfirm(deleteTargetId)
            setShowDeleteModal(false)
            setDeleteTargetId(null)
          }}
          entityName='1:1'
        />
      )}
    </div>
  )
}
