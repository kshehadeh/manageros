'use client'

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
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
  ColumnDef,
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
  ChevronRight,
  ChevronDown,
  Search,
  ChevronLeft,
  Layers,
  ArrowUpDown,
  Filter,
  Eye,
  Edit,
} from 'lucide-react'
import { toast } from 'sonner'
import { DeleteModal } from '@/components/common/delete-modal'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import {
  ViewDetailsMenuItem,
  EditMenuItem,
  DeleteMenuItem,
  ContextMenuItem,
} from '@/components/common/context-menu-items'
import { ViewDropdown } from '@/components/common/view-dropdown'
import { useTableSettingsUrlSync } from '@/hooks/use-table-settings-url-sync'
import type { TableUrlConfig } from '@/lib/table-url-config'

// Type for column meta
interface ColumnMeta {
  hidden?: boolean
  className?: string
}

// Generic data table configuration interface
export interface DataTableConfig<
  TData = unknown,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> {
  // Entity identification
  entityType: string
  entityName: string
  entityNamePlural: string

  // Data fetching (method syntax for better variance)
  useDataHook(_params: {
    page?: number
    limit?: number
    filters?: TFilters
    immutableFilters?: Partial<TFilters>
    sort?: string
    enabled?: boolean
  }): {
    data?: unknown | null
    loading: boolean
    error?: string | null
    refetch: () => void
    updateItem?: (_id: string, _updates: Partial<TData>) => void
  }

  // Settings management (method syntax for better variance)
  useSettingsHook(_params: { settingsId: string; enabled: boolean }): {
    settings: {
      grouping: string
      sorting: Array<{ id: string; desc: boolean }>
      sort: { field: string; direction: 'asc' | 'desc' }
      filters: TFilters
    }
    isLoaded?: boolean
    updateSorting: (_sorting: Array<{ id: string; desc: boolean }>) => void
    updateGrouping: (_grouping: string) => void
    updateSort: (_sort: { field: string; direction: 'asc' | 'desc' }) => void
    updateFilters: (_filters: Partial<TFilters>) => void
  }

  // Column definitions
  createColumns: (_params: {
    onButtonClick: (_e: React.MouseEvent, _id: string, _extra?: unknown) => void
    grouping: string[]
    visibleColumns?: string[]
    refetch: () => void
    applyOptimisticUpdate: (_entityId: string, _updates: Partial<TData>) => void
    removeOptimisticUpdate: (_entityId: string) => void
    clearAllOptimisticUpdates: () => void
    [key: string]: unknown
  }) => ColumnDef<TData>[]

  // Actions
  deleteAction?: (_id: string) => Promise<void>
  onRowClick?: (
    _router: AppRouterInstance,
    _id: string,
    _entity?: TData
  ) => void

  // UI configuration
  searchPlaceholder: string
  emptyMessage: string
  loadingMessage: string

  // Grouping and sorting options
  groupingOptions: Array<{ value: string; label: string }>
  sortOptions: Array<{ value: string; label: string }>

  // Filter configuration
  filterContent?: (_params: {
    settings: { filters: TFilters } & Record<string, unknown>
    updateFilters: (_filters: Partial<TFilters>) => void
    immutableFilters?: Partial<TFilters>
  }) => React.ReactNode
  hasActiveFiltersFn?: (_filters: TFilters) => boolean
  clearFiltersFn?: () => Partial<TFilters>

  // Optional: format a concise, human-readable summary of active filters
  formatFiltersSummary?: (_filters: TFilters) => string

  // Group label formatting
  getGroupLabel?: (_groupValue: string, _groupingColumn: string) => string

  // Group ordering function - returns a number to determine group order (lower = first)
  // If not provided, groups are sorted alphabetically
  getGroupOrder?: (_groupValue: string, _groupingColumn: string) => number

  // Global filter function
  globalFilterFn?: (
    _row: { original: TData },
    _columnId: string,
    _value: string
  ) => boolean

  // Additional props passed to columns
  columnProps?: Record<string, unknown>

  // Function to extract ID from entity (defaults to accessing .id property)
  getId?: (_entity: TData) => string

  // Custom context menu items
  contextMenuItems?: (_params: {
    entityId: string
    entity: TData
    close: () => void
    refetch: () => void
    applyOptimisticUpdate: (_entityId: string, _updates: Partial<TData>) => void
    removeOptimisticUpdate: (_entityId: string) => void
    onDelete: () => void
  }) => React.ReactNode

  // Configurable detail and edit context menu item overrides
  onViewDetails?: (
    _router: AppRouterInstance,
    _params: {
      entityId: string
      entity: TData
      close: () => void
    }
  ) => void
  onEdit?: (
    _router: AppRouterInstance,
    _params: {
      entityId: string
      entity: TData
      close: () => void
    }
  ) => void

  // Custom row className function
  getRowClassName?: (_entity: TData) => string

  // URL synchronization configuration (optional)
  // If provided, table settings will be synced to URL query parameters
  urlConfig?: TableUrlConfig
}

interface GenericDataTableProps<
  TData = unknown,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> {
  config: DataTableConfig<TData, TFilters>
  onEntityUpdate?: () => void
  hideFilters?: boolean
  hideHeaders?: boolean
  settingsId?: string
  page?: number
  limit?: number
  enablePagination?: boolean
  visibleColumns?: string[]
  immutableFilters?: Partial<TFilters>
  onRowClick?: (_id: string, _extra?: unknown) => void
}

export function GenericDataTable<
  TData = unknown,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
>({
  config,
  onEntityUpdate: _onEntityUpdate,
  hideFilters = false,
  hideHeaders = false,
  settingsId,
  limit = 20,
  enablePagination = false,
  visibleColumns,
  immutableFilters,
  onRowClick: propOnRowClick,
}: GenericDataTableProps<TData, TFilters>): React.ReactElement {
  const router = useRouter()
  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Map<string, Partial<TData>>
  >(new Map())

  // Use settings hook for persistent state
  const {
    settings,
    isLoaded: settingsLoaded = true,
    updateSorting,
    updateGrouping,
    updateSort,
    updateFilters,
  } = config.useSettingsHook({
    settingsId: settingsId || 'default',
    enabled: true,
  })

  // Sync settings to URL parameters if URL config is provided
  // Note: URL sync works even with immutableFilters - the URL params will eventually
  // take precedence as the user interacts with filters
  useTableSettingsUrlSync({
    settings: {
      filters: settings.filters,
      sort: settings.sort,
      grouping: settings.grouping,
    },
    config: config.urlConfig || {
      filterParamMap: {},
      defaultValues: {},
    },
    settingsId: settingsId || 'default',
    enabled: !!config.urlConfig,
  })

  // Debounced search state - separate from internal filters to prevent immediate API calls
  const [searchInput, setSearchInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const hasExpandedGroups = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: limit,
  })

  // Convert grouping option to Tanstack Table grouping state
  const effectiveGrouping = useMemo(() => {
    return settings.grouping === 'none' ? [] : [settings.grouping]
  }, [settings.grouping])

  // Set initial sorting for grouping
  useEffect(() => {
    if (effectiveGrouping.length > 0 && settings.sorting.length === 0) {
      updateSorting([{ id: effectiveGrouping[0], desc: false }])
    }
  }, [effectiveGrouping, settings.sorting.length, updateSorting])

  // Get current user's session
  const { isLoaded } = useUser()
  const sessionStatus = isLoaded ? 'authenticated' : 'loading'

  // Don't fetch data until both session and settings are loaded
  // This ensures filters from localStorage are applied before the first API call
  const shouldFetch = sessionStatus !== 'loading' && settingsLoaded

  // Initialize search input from loaded settings only once
  useEffect(() => {
    if (settingsLoaded && searchInput === '') {
      const searchValue = settings.filters.search
      setSearchInput(typeof searchValue === 'string' ? searchValue : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded]) // Only depend on settingsLoaded, not the search value

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    // Only update if the search input is different from settings and not empty
    if (searchInput !== settings.filters.search) {
      const timeoutId = setTimeout(() => {
        setIsSearching(true)
        updateFilters({ search: searchInput } as unknown as Partial<TFilters>)
      }, 300) // 300ms debounce

      return () => clearTimeout(timeoutId)
    }
  }, [searchInput, settings.filters.search, updateFilters])

  // Memoize filters to prevent unnecessary refetches
  const memoizedFilters = useMemo(
    () => settings.filters as TFilters,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(settings.filters)]
  )

  const memoizedImmutableFilters = useMemo(
    () => (immutableFilters || {}) as Partial<TFilters>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(immutableFilters)]
  )

  // Convert sort settings to API format (field:direction)
  const sortParam = useMemo(() => {
    if (!settings.sort || !settings.sort.field) return ''
    return `${settings.sort.field}:${settings.sort.direction}`
  }, [settings.sort])

  // Fetch data using the configured hook
  const {
    data: entitiesData,
    loading,
    error,
    refetch,
  } = config.useDataHook({
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

  // Extract entities from data and apply optimistic updates
  const entities = useMemo(() => {
    if (!entitiesData) return []
    const dataKey = config.entityNamePlural.toLowerCase()
    const data = entitiesData as Record<string, unknown>

    // Try to get entities using the expected key
    let baseEntities = (data[dataKey] as TData[]) || []

    // Fallback: if no entities found, check if data itself is an array
    // or if there's a different key structure
    if (baseEntities.length === 0 && Array.isArray(data)) {
      baseEntities = data as TData[]
    }

    // Apply optimistic updates
    return baseEntities.map(entity => {
      const entityId = config.getId
        ? config.getId(entity)
        : (entity as { id: string }).id
      const optimisticUpdate = optimisticUpdates.get(entityId)

      if (optimisticUpdate) {
        return { ...entity, ...optimisticUpdate }
      }

      return entity
    })
  }, [entitiesData, config, optimisticUpdates])

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    if (config.hasActiveFiltersFn) {
      return config.hasActiveFiltersFn(settings.filters)
    }
    return Object.values(settings.filters).some(
      value =>
        value !== '' &&
        value !== 'all' &&
        (!Array.isArray(value) || value.length > 0)
    )
  }, [settings.filters, config])

  // Generate human-readable labels for grouping and sorting using provided options
  const groupingLabel = useMemo(() => {
    const value = settings.grouping
    const option = config.groupingOptions.find(o => o.value === value)
    if (!option) return value === 'none' ? 'No grouping' : value
    return option.label
  }, [settings.grouping, config.groupingOptions])

  const sortingLabel = useMemo(() => {
    const field = settings.sort?.field
    if (!field) return 'Default Sort'
    const option = config.sortOptions.find(o => o.value === field)
    const dir = settings.sort?.direction === 'desc' ? 'desc' : 'asc'
    const fieldLabel = option ? option.label : field
    return `${fieldLabel} (${dir})`
  }, [settings.sort, config.sortOptions])

  // Compute filter summary
  const filtersSummary = useMemo(() => {
    const filters = settings.filters as TFilters
    if (config.formatFiltersSummary) return config.formatFiltersSummary(filters)
    // Default: show search and count of other active filters
    const entries = Object.entries(filters)
    const active = entries.filter(([_, v]) => {
      if (v === '' || v === 'all' || v === null || v === undefined) return false
      if (Array.isArray(v)) return v.length > 0
      return true
    })
    if (active.length === 0) return 'None'
    const searchEntry = active.find(([k]) => k === 'search')
    const others = active.filter(([k]) => k !== 'search')
    const parts: string[] = []
    if (searchEntry) {
      const val = String(searchEntry[1])
      if (val) parts.push(`search: "${val}"`)
    }
    if (others.length > 0)
      parts.push(`${others.length} filter${others.length > 1 ? 's' : ''}`)
    return parts.join(', ')
  }, [settings.filters, config])

  // Helper function to format group labels
  const getGroupLabel = (groupValue: string, groupingColumn: string) => {
    if (config.getGroupLabel) {
      return config.getGroupLabel(groupValue, groupingColumn)
    }
    return groupValue || 'Unassigned'
  }

  // Helper function to get group order
  const getGroupOrder = useCallback(
    (groupValue: string, groupingColumn: string) => {
      if (config.getGroupOrder) {
        return config.getGroupOrder(groupValue, groupingColumn)
      }
      // Default: sort alphabetically (no specific order)
      return Infinity
    },
    [config]
  )

  // Handle context menu actions
  const handleDeleteConfirm = async (entityId: string) => {
    if (!config.deleteAction) return

    try {
      await config.deleteAction(entityId)
      toast.success(`${config.entityName} deleted successfully`)
      refetch()
    } catch (error) {
      console.error(
        `Failed to delete ${config.entityName.toLowerCase()}:`,
        error
      )
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to delete ${config.entityName.toLowerCase()}`
      )
    }
  }

  const handleRowClick = (entity: TData, extra?: unknown) => {
    const entityId = config.getId
      ? config.getId(entity)
      : (entity as { id: string }).id

    // Use prop onRowClick if provided, otherwise use config onRowClick, otherwise default navigation
    if (propOnRowClick) {
      propOnRowClick(entityId, extra)
    } else if (config.onRowClick) {
      config.onRowClick(router, entityId, entity)
    } else {
      router.push(`/${config.entityType}/${entityId}`)
    }
  }

  // Optimistic update functions
  const applyOptimisticUpdate = useCallback(
    (entityId: string, updates: Partial<TData>) => {
      setOptimisticUpdates(prev => new Map(prev).set(entityId, updates))
    },
    []
  )

  const removeOptimisticUpdate = useCallback((entityId: string) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev)
      newMap.delete(entityId)
      return newMap
    })
  }, [])

  const clearAllOptimisticUpdates = useCallback(() => {
    setOptimisticUpdates(new Map())
  }, [])

  // Clear optimistic updates when data is refetched
  useEffect(() => {
    if (!loading && entitiesData) {
      clearAllOptimisticUpdates()
    }
  }, [entitiesData, loading, clearAllOptimisticUpdates])

  // Create columns
  const columns = useMemo(
    () =>
      config.createColumns({
        onButtonClick: handleButtonClick,
        grouping: effectiveGrouping,
        visibleColumns,
        refetch,
        applyOptimisticUpdate,
        removeOptimisticUpdate,
        clearAllOptimisticUpdates,
        ...config.columnProps,
      }),
    [
      handleButtonClick,
      effectiveGrouping,
      visibleColumns,
      refetch,
      applyOptimisticUpdate,
      removeOptimisticUpdate,
      clearAllOptimisticUpdates,
      config,
    ]
  )

  const table = useReactTable({
    data: entities,
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
    // Disable frontend sorting when using server-side sorting
    getSortedRowModel: sortParam ? getCoreRowModel() : getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    enableGrouping: true,
    enableColumnResizing: false,
    globalFilterFn: config.globalFilterFn,
    manualPagination: enablePagination, // Use server-side pagination
    manualSorting: Boolean(sortParam), // Disable frontend sorting when backend sorting is active
    pageCount:
      enablePagination && entitiesData
        ? (entitiesData as { pagination?: { totalPages: number } }).pagination
            ?.totalPages
        : undefined,
  })

  // Sort rows when grouped to respect group order
  // Use getExpandedRowModel() to only show rows from expanded groups
  const tableRows = table.getExpandedRowModel().rows
  const sortedRows = useMemo(() => {
    if (effectiveGrouping.length === 0 || !config.getGroupOrder) {
      return tableRows
    }

    const groupingColumn = effectiveGrouping[0]

    // Build a structure that preserves parent-child relationships
    // Group rows with their children, sort groups, then flatten
    const groups: Array<{
      groupRow: (typeof tableRows)[0]
      children: typeof tableRows
    }> = []
    const orphanRows: typeof tableRows = []
    const currentGroup: {
      groupRow: (typeof tableRows)[0] | null
      children: typeof tableRows
    } = {
      groupRow: null,
      children: [],
    }

    for (const row of tableRows) {
      if (row.getIsGrouped()) {
        // Save previous group if it exists
        if (currentGroup.groupRow) {
          groups.push({
            groupRow: currentGroup.groupRow,
            children: [...currentGroup.children],
          })
        }
        // Start new group
        currentGroup.groupRow = row
        currentGroup.children = []
      } else {
        // Add to current group's children if we have a group, otherwise it's an orphan
        if (currentGroup.groupRow) {
          currentGroup.children.push(row)
        } else {
          orphanRows.push(row)
        }
      }
    }

    // Don't forget the last group
    if (currentGroup.groupRow) {
      groups.push({
        groupRow: currentGroup.groupRow,
        children: [...currentGroup.children],
      })
    }

    // Sort groups by their order value
    groups.sort((a, b) => {
      const aValue = String(a.groupRow.getValue(groupingColumn) || '')
      const bValue = String(b.groupRow.getValue(groupingColumn) || '')
      const aOrder = getGroupOrder(aValue, groupingColumn)
      const bOrder = getGroupOrder(bValue, groupingColumn)

      // If orders are equal, sort alphabetically
      if (aOrder === bOrder) {
        return aValue.localeCompare(bValue)
      }
      return aOrder - bOrder
    })

    // Flatten back to array: orphan rows first (if any), then group row followed by its children
    const sorted: typeof tableRows = []
    // Add orphan rows first (shouldn't happen with proper grouping, but handle it gracefully)
    sorted.push(...orphanRows)
    for (const group of groups) {
      sorted.push(group.groupRow)
      sorted.push(...group.children)
    }

    return sorted
  }, [tableRows, effectiveGrouping, config.getGroupOrder, getGroupOrder])

  // Expand all groups by default when table is ready
  useEffect(() => {
    if (
      !loading &&
      entities.length > 0 &&
      effectiveGrouping.length > 0 &&
      !hasExpandedGroups.current
    ) {
      table.toggleAllRowsExpanded(true)
      hasExpandedGroups.current = true
    }
  }, [loading, entities.length, effectiveGrouping.length, table])

  // Reset expanded groups flag when grouping changes
  useEffect(() => {
    hasExpandedGroups.current = false
  }, [settings.grouping])

  if (error) {
    return (
      <div className='flex items-center justify-center py-3xl'>
        <div className='text-center'>
          <p className='text-destructive font-medium'>
            Error loading {config.entityNamePlural.toLowerCase()}
          </p>
          <p className='text-sm text-muted-foreground mt-sm'>{error}</p>
          <Button onClick={refetch} variant='outline' className='mt-xl'>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-md'>
      {/* Filter Controls */}
      {!hideFilters && (
        <div className='space-y-md px-lg md:px-0'>
          <div className='flex items-center gap-xl'>
            {/* Search Input - Takes up most space */}
            {!immutableFilters?.search && (
              <div className='relative flex-1 min-w-0'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10' />
                <Input
                  ref={searchInputRef}
                  key='search-input'
                  placeholder={config.searchPlaceholder}
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className='pl-3xl'
                />
                {isSearching && (
                  <div className='absolute right-2 top-2.5'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                  </div>
                )}
              </div>
            )}

            {/* View Dropdown - Consolidates grouping, sorting, and filtering */}
            <ViewDropdown
              groupingValue={settings.grouping}
              onGroupingChange={updateGrouping}
              groupingOptions={config.groupingOptions}
              sortField={settings.sort?.field || ''}
              sortDirection={settings.sort?.direction || 'asc'}
              onSortChange={(field, direction) =>
                updateSort({ field, direction })
              }
              sortOptions={config.sortOptions}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={() => {
                if (config.clearFiltersFn) {
                  updateFilters(config.clearFiltersFn())
                } else {
                  updateFilters({ search: '' } as unknown as Partial<TFilters>)
                }
              }}
              filterContent={
                config.filterContent
                  ? (() => {
                      const content = config.filterContent({
                        settings,
                        updateFilters,
                        immutableFilters,
                      })
                      // Return null explicitly if content is null/undefined/false to properly hide filter section
                      // This ensures the ViewDropdown can properly detect when there's no filter content
                      if (
                        content === null ||
                        content === undefined ||
                        content === false
                      ) {
                        return null
                      }
                      return content
                    })()
                  : null
              }
              className='shrink-0 min-w-fit'
            />
          </div>

          {/* Results Count with View Summary */}
          <div className='mx-[var(--spacing-md)] text-sm text-muted-foreground'>
            {loading && entities.length === 0
              ? config.loadingMessage
              : (() => {
                  const countText = `Showing ${entities.length} ${
                    entities.length === 1
                      ? config.entityName.toLowerCase()
                      : config.entityNamePlural.toLowerCase()
                  }${
                    entitiesData
                      ? ` of ${(entitiesData as { pagination?: { totalCount: number } }).pagination?.totalCount || 0} total`
                      : ''
                  }`
                  return (
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                      <span>{countText}</span>
                      <span className='inline-flex items-center gap-sm'>
                        <Layers className='h-3.5 w-3.5' />
                        <span>{groupingLabel}</span>
                      </span>
                      <span className='inline-flex items-center gap-sm'>
                        <ArrowUpDown className='h-3.5 w-3.5' />
                        <span>{sortingLabel}</span>
                      </span>
                      <span className='inline-flex items-center gap-sm'>
                        <Filter className='h-3.5 w-3.5' />
                        <span>{filtersSummary}</span>
                      </span>
                    </div>
                  )
                })()}
          </div>
        </div>
      )}

      {/* Table */}
      <div className='-mx-3 md:mx-0 md:rounded-md border-y md:border relative'>
        {/* Loading Spinner in top right corner */}
        {loading && (
          <div className='absolute top-md right-md z-10 bg-background/80 rounded-full p-md'>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
          </div>
        )}
        <Table>
          {!hideHeaders && (
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
          )}
          <TableBody>
            {loading && entities.length === 0 ? (
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
                    <span className='ml-md text-sm text-muted-foreground'>
                      {config.loadingMessage}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedRows?.length ? (
              sortedRows.map(row => {
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
                        <div className='flex items-center gap-md'>
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

                // Regular entity row
                const customRowClassName =
                  config.getRowClassName?.(row.original) || ''
                return (
                  <TableRow
                    key={row.id}
                    className={`hover:bg-accent/50 cursor-pointer ${customRowClassName}`}
                    onClick={() => handleRowClick(row.original)}
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
                    ? `No ${config.entityNamePlural.toLowerCase()} found matching your filters.`
                    : config.emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {enablePagination &&
        Boolean(entitiesData) &&
        (entitiesData as { pagination?: unknown }).pagination !== undefined && (
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              Page{' '}
              {
                (
                  entitiesData as {
                    pagination: { page: number; totalPages: number }
                  }
                ).pagination.page
              }{' '}
              of{' '}
              {
                (
                  entitiesData as {
                    pagination: { page: number; totalPages: number }
                  }
                ).pagination.totalPages
              }
            </div>
            <div className='flex items-center gap-md'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => table.previousPage()}
                disabled={
                  !(
                    entitiesData as { pagination: { hasPreviousPage: boolean } }
                  ).pagination.hasPreviousPage ||
                  (loading && entities.length === 0)
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
                  !(entitiesData as { pagination: { hasNextPage: boolean } })
                    .pagination.hasNextPage ||
                  (loading && entities.length === 0)
                }
              >
                Next
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        )}

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => {
          // Find the entity for custom context menu items
          const entity = entities.find(e => {
            const id = config.getId ? config.getId(e) : (e as { id: string }).id
            return id === entityId
          })

          // Use custom context menu items if provided, otherwise use default ones
          if (config.contextMenuItems && entity) {
            return config.contextMenuItems({
              entityId,
              entity,
              close,
              refetch,
              applyOptimisticUpdate,
              removeOptimisticUpdate,
              onDelete: () => {
                setDeleteTargetId(entityId)
                setShowDeleteModal(true)
              },
            })
          }

          // Default context menu items with configurable overrides
          return (
            <>
              {config.onViewDetails ? (
                <ContextMenuItem
                  onClick={() => {
                    config.onViewDetails!(router, {
                      entityId,
                      entity: entity!,
                      close,
                    })
                  }}
                  icon={<Eye className='h-4 w-4' />}
                >
                  View Details
                </ContextMenuItem>
              ) : (
                <ViewDetailsMenuItem
                  entityId={entityId}
                  entityType={
                    config.entityType as
                      | 'people'
                      | 'teams'
                      | 'initiatives'
                      | 'oneonones'
                      | 'tasks'
                  }
                  close={close}
                />
              )}
              {config.onEdit ? (
                <ContextMenuItem
                  onClick={() => {
                    config.onEdit!(router, {
                      entityId,
                      entity: entity!,
                      close,
                    })
                  }}
                  icon={<Edit className='h-4 w-4' />}
                >
                  Edit
                </ContextMenuItem>
              ) : (
                <EditMenuItem
                  entityId={entityId}
                  entityType={
                    config.entityType as
                      | 'people'
                      | 'teams'
                      | 'initiatives'
                      | 'oneonones'
                      | 'tasks'
                  }
                  close={close}
                />
              )}
              {config.deleteAction && (
                <DeleteMenuItem
                  onDelete={() => {
                    setDeleteTargetId(entityId)
                    setShowDeleteModal(true)
                  }}
                  close={close}
                />
              )}
            </>
          )
        }}
      </ContextMenuComponent>

      {/* Delete Confirmation Modal */}
      {config.deleteAction && (
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
          title={`Delete ${config.entityName}`}
          entityName={config.entityName.toLowerCase()}
        />
      )}
    </div>
  )
}
