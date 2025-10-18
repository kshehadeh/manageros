'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Search,
  Filter,
  Group,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { useTeams as useTeamsApi } from '@/hooks/use-teams'
import { useTeamsCache } from '@/hooks/use-organization-cache'
import { useTeamTableSettings } from '@/hooks/use-team-table-settings'
import { createTeamsColumns } from './columns'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import {
  ViewDetailsMenuItem,
  EditMenuItem,
} from '@/components/common/context-menu-items'
import { dataTableStyles } from '@/components/common/data-table-styles'

interface TeamsDataTableProps {
  settingsId?: string
  page?: number
  limit?: number
  enablePagination?: boolean
}

export function TeamsDataTable({
  settingsId,
  limit = 20,
  enablePagination = false,
}: TeamsDataTableProps) {
  const router = useRouter()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()

  const { settings, updateSorting, updateGrouping, updateSort, updateFilters } =
    useTeamTableSettings({
      settingsId: settingsId || 'default',
      enabled: true,
    })

  const [searchInput, setSearchInput] = useState('')
  const hasExpandedGroups = useRef(false)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: limit,
  })

  // Convert grouping option to Tanstack Table grouping state
  const effectiveGrouping = useMemo(() => {
    return settings.grouping === 'none' ? [] : [settings.grouping]
  }, [settings.grouping])

  // Set initial sorting for parent grouping
  useEffect(() => {
    if (effectiveGrouping.includes('parent') && settings.sorting.length === 0) {
      updateSorting([{ id: 'parent', desc: false }])
    }
  }, [effectiveGrouping, settings.sorting.length, updateSorting])

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      updateFilters({ search: searchInput })
    }, 400)

    return () => clearTimeout(handler)
  }, [searchInput, updateFilters])

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(
    () => ({
      search: settings.filters.search,
      parentId: settings.filters.parentId,
    }),
    [settings.filters.search, settings.filters.parentId]
  )

  // Fetch teams via API with server-side search/parent filter
  const { data: teamsData, loading } = useTeamsApi({
    page: enablePagination ? pagination.pageIndex + 1 : 1,
    limit: enablePagination ? pagination.pageSize : limit,
    filters,
    sort: settings.sort.field
      ? `${settings.sort.field}:${settings.sort.direction}`
      : undefined,
    enabled: true,
  })

  const teams = teamsData?.teams ?? []

  // Parent filter options from cache (best-effort)
  const { teams: cachedTeams } = useTeamsCache()
  const parentOptions = useMemo(() => {
    const parents = new Map<string, string>()
    cachedTeams.forEach(t => {
      if (t.parent) parents.set(t.parent.id, t.parent.name || '—')
    })
    return Array.from(parents.entries()).map(([id, name]) => ({ id, name }))
  }, [cachedTeams])

  // Columns
  const getGroupLabel = (groupValue: string, groupingColumn: string) => {
    switch (groupingColumn) {
      case 'parent':
        return groupValue || 'No Parent'
      default:
        return groupValue
    }
  }

  const columns = useMemo(
    () =>
      createTeamsColumns({
        onButtonClick: handleButtonClick,
        grouping: effectiveGrouping,
      }),
    [handleButtonClick, effectiveGrouping]
  )

  const table = useReactTable({
    data: teams,
    columns,
    state: {
      grouping: effectiveGrouping,
      sorting: settings.sorting,
      columnFilters,
      expanded,
      globalFilter,
      pagination: enablePagination ? pagination : undefined,
    },
    initialState: { expanded: true },
    onGroupingChange: () => {},
    onSortingChange: updaterOrValue => {
      const newSorting =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(settings.sorting)
          : updaterOrValue
      updateSorting(newSorting)

      // Update server sort only for known fields
      const first = newSorting[0]
      if (first) {
        const fieldMap: Record<string, string> = {
          name: 'name',
          createdAt: 'createdAt',
          updatedAt: 'updatedAt',
        }
        const mapped = fieldMap[first.id]
        if (mapped)
          updateSort({ field: mapped, direction: first.desc ? 'desc' : 'asc' })
      }
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
    manualPagination: enablePagination,
    pageCount:
      enablePagination && teamsData?.pagination
        ? teamsData.pagination.totalPages
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

  return (
    <div className={dataTableStyles.container}>
      {/* Filters */}
      <div className='flex items-center gap-3 flex-wrap'>
        <div className='relative w-full sm:w-64'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            placeholder='Search teams'
            value={searchInput}
            onChange={e => {
              setSearchInput(e.target.value)
            }}
            className='pl-10'
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant='outline' className='flex items-center gap-2'>
              <Filter className='h-4 w-4' /> Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-80'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Parent team</label>
                <Select
                  value={settings.filters.parentId || 'all'}
                  onValueChange={val =>
                    updateFilters({ parentId: val === 'all' ? '' : val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='All' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='no-parent'>No parent</SelectItem>
                    {parentOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                onClick={() =>
                  updateGrouping(
                    settings.grouping === 'parent' ? 'none' : 'parent'
                  )
                }
                className='flex items-center gap-2'
              >
                <Group className='h-4 w-4' />{' '}
                {settings.grouping === 'parent'
                  ? 'Grouped by parent'
                  : 'No grouping'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle group by parent team</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

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
                    | { hidden?: boolean; className?: string }
                    | undefined
                  if (meta?.hidden) return null

                  return (
                    <TableHead key={header.id} className={meta?.className}>
                      {header.isPlaceholder ? null : (
                        <div
                          className='flex items-center gap-2 select-none'
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <ArrowUpDown className='h-4 w-4 text-muted-foreground' />
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length
              ? table.getRowModel().rows.map(row => {
                  if (row.getIsGrouped()) {
                    // Group header row
                    return (
                      <TableRow
                        key={row.id}
                        className={dataTableStyles.body.groupRow}
                      >
                        <TableCell
                          colSpan={
                            columns.filter(
                              col => !(col.meta as { hidden?: boolean })?.hidden
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

                  // Regular team row
                  return (
                    <TableRow
                      key={row.id}
                      className='hover:bg-accent/50 cursor-pointer'
                      onClick={() => router.push(`/teams/${row.original.id}`)}
                    >
                      {row
                        .getVisibleCells()
                        .filter(
                          cell =>
                            !(
                              cell.column.columnDef.meta as { hidden?: boolean }
                            )?.hidden
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
              : !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center text-muted-foreground'
                    >
                      No teams found.
                    </TableCell>
                  </TableRow>
                )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && teamsData?.pagination && (
        <div className='flex items-center justify-between gap-2'>
          <div className='text-sm text-muted-foreground'>
            Page {teamsData.pagination.page} of{' '}
            {teamsData.pagination.totalPages}
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                setPagination(prev => ({
                  ...prev,
                  pageIndex: Math.max(0, prev.pageIndex - 1),
                }))
              }
              disabled={!teamsData.pagination.hasPreviousPage}
            >
              <ChevronLeft className='h-4 w-4' /> Prev
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                setPagination(prev => ({
                  ...prev,
                  pageIndex: prev.pageIndex + 1,
                }))
              }
              disabled={!teamsData.pagination.hasNextPage}
            >
              Next <ChevronRight className='h-4 w-4' />
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
              entityType='teams'
              close={close}
            />
            <EditMenuItem
              entityId={entityId}
              entityType='teams'
              close={close}
            />
          </>
        )}
      </ContextMenuComponent>
    </div>
  )
}
