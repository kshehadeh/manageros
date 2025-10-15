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
import { deleteMeeting } from '@/lib/actions/meeting'
import { deleteMeetingInstance } from '@/lib/actions/meeting-instance'
import { toast } from 'sonner'
import { DeleteModal } from '@/components/common/delete-modal'
import { createMeetingColumns } from './columns'
import { useSession } from 'next-auth/react'
import { useMeetings } from '@/hooks/use-meetings'
import { useMeetingTableSettings } from '@/hooks/use-meeting-table-settings'
import { InitiativeMultiSelect } from '@/components/ui/initiative-multi-select'
import type {
  UpcomingMeeting,
  MeetingWithRelations,
  MeetingInstanceWithRelations,
} from '@/components/meetings/shared-meetings-table'
import { useTeamsCache } from '@/hooks/use-organization-cache'

// Type for column meta
interface ColumnMeta {
  hidden?: boolean
  className?: string
}

interface MeetingDataTableProps {
  onMeetingUpdate?: () => void
  hideFilters?: boolean
  settingsId?: string
  limit?: number
  enablePagination?: boolean
  immutableFilters?: {
    search?: string
    teamId?: string
    initiativeId?: string
    scheduledFrom?: string
    scheduledTo?: string
  }
}

// Global filter function for search
const globalFilterFn = (
  row: { original: UpcomingMeeting },
  columnId: string,
  value: string
) => {
  const meeting = row.original
  const searchValue = value.toLowerCase()
  const isInstance = meeting.type === 'instance'
  const meetingData = isInstance
    ? (meeting as MeetingInstanceWithRelations).meeting
    : (meeting as MeetingWithRelations)

  return (
    meetingData.title.toLowerCase().includes(searchValue) ||
    meetingData.description?.toLowerCase().includes(searchValue) ||
    meetingData.team?.name.toLowerCase().includes(searchValue) ||
    meetingData.initiative?.title.toLowerCase().includes(searchValue) ||
    false
  )
}

export function MeetingDataTable({
  onMeetingUpdate: _onMeetingUpdate,
  hideFilters = false,
  settingsId,
  limit = 20,
  enablePagination = false,
  immutableFilters,
}: MeetingDataTableProps) {
  const router = useRouter()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  // Use settings hook for persistent state
  const {
    settings,
    isLoaded: settingsLoaded,
    updateSorting,
    updateGrouping,
    updateSort,
    updateFilters,
  } = useMeetingTableSettings({
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

  // Get current user's session
  const { status: sessionStatus } = useSession()

  // Don't fetch data if we're waiting for session or settings to load
  const shouldFetch = sessionStatus !== 'loading' && settingsLoaded

  // Initialize search input from loaded settings
  useEffect(() => {
    if (settingsLoaded) {
      setSearchInput(settings.filters.search)
    }
  }, [settingsLoaded, settings.filters.search])

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
    [JSON.stringify(settings.filters), settingsLoaded]
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

  // Fetch data using useMeetings hook
  const {
    data: meetingsData,
    loading,
    error,
    refetch,
  } = useMeetings({
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

  // Listen for meeting creation events to refresh the list
  useEffect(() => {
    const handleMeetingCreated = () => {
      refetch()
    }

    window.addEventListener('meeting:created', handleMeetingCreated)
    return () =>
      window.removeEventListener('meeting:created', handleMeetingCreated)
  }, [refetch])

  const { teams } = useTeamsCache()

  const meetings = useMemo(
    () => meetingsData?.meetings || [],
    [meetingsData?.meetings]
  )

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    return (
      settings.filters.search !== '' ||
      settings.filters.teamId !== '' ||
      settings.filters.initiativeId !== '' ||
      settings.filters.scheduledFrom !== '' ||
      settings.filters.scheduledTo !== ''
    )
  }, [settings.filters])

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    meetingId: string
    isInstance: boolean
    triggerType: 'rightClick' | 'button'
  }>({
    visible: false,
    x: 0,
    y: 0,
    meetingId: '',
    isInstance: false,
    triggerType: 'rightClick',
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const handleRowClick = (meetingId: string, isInstance = false) => {
    const href = isInstance
      ? `/meetings/${meetingId.split('-')[0]}/instances/${meetingId.split('-')[1]}`
      : `/meetings/${meetingId}`
    router.push(href)
  }

  const handleButtonClick = (
    e: React.MouseEvent,
    meetingId: string,
    isInstance = false
  ) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      visible: true,
      x: rect.right - 160,
      y: rect.bottom + 4,
      meetingId,
      isInstance,
      triggerType: 'button',
    })
  }

  const handleDeleteConfirm = async (meetingId: string, isInstance = false) => {
    try {
      if (isInstance) {
        // For instances, split the composite ID
        const instanceId = meetingId.split('-')[1]
        await deleteMeetingInstance(instanceId)
        toast.success('Meeting instance deleted successfully')
      } else {
        await deleteMeeting(meetingId)
        toast.success('Meeting deleted successfully')
      }
      await refetch()
    } catch (error) {
      console.error('Failed to delete meeting:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete meeting'
      )
    }
  }

  const getGroupLabel = (groupValue: string, groupingColumn: string) => {
    switch (groupingColumn) {
      case 'team':
        return groupValue || 'No Team'
      case 'initiative':
        return groupValue || 'No Initiative'
      default:
        return groupValue
    }
  }

  const columns = createMeetingColumns({
    onButtonClick: handleButtonClick,
    grouping: effectiveGrouping,
  })

  const table = useReactTable({
    data: meetings,
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
      enablePagination && meetingsData?.pagination
        ? meetingsData.pagination.totalPages
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
        <div className='text-destructive'>Error loading meetings: {error}</div>
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
                    placeholder='Search meetings...'
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
                      <h3 className='font-medium'>Filter Meetings</h3>
                      <button
                        onClick={() => {
                          setGlobalFilter('')
                          setColumnFilters([])
                          setSearchInput('')
                          updateFilters({
                            search: '',
                            teamId: '',
                            initiativeId: '',
                            scheduledFrom: '',
                            scheduledTo: '',
                          })
                        }}
                        className='text-sm text-muted-foreground hover:text-foreground'
                      >
                        Clear all
                      </button>
                    </div>

                    <div className='space-y-4'>
                      {/* Team Filter - Hidden if immutable */}
                      {!immutableFilters?.teamId && (
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
                              {teams.map(team => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                              settings.filters.initiativeId
                                ? [settings.filters.initiativeId]
                                : []
                            }
                            onChange={value =>
                              updateFilters({
                                initiativeId: value[0] || '',
                              })
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
                          <SelectItem value='team'>Team</SelectItem>
                          <SelectItem value='initiative'>Initiative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Group meetings by team or initiative</p>
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
                      <h3 className='font-medium'>Sort Meetings</h3>
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
                            <SelectItem value='scheduledAt'>
                              Scheduled Date
                            </SelectItem>
                            <SelectItem value='title'>Title</SelectItem>
                            <SelectItem value='team'>Team</SelectItem>
                            <SelectItem value='initiative'>
                              Initiative
                            </SelectItem>
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
              {enablePagination && meetingsData?.pagination ? (
                <>
                  {meetingsData.pagination.totalCount > 0 ? (
                    <>
                      Showing{' '}
                      {(meetingsData.pagination.page - 1) *
                        meetingsData.pagination.limit +
                        1}{' '}
                      to{' '}
                      {Math.min(
                        meetingsData.pagination.page *
                          meetingsData.pagination.limit,
                        meetingsData.pagination.totalCount
                      )}{' '}
                      of {meetingsData.pagination.totalCount} meetings
                    </>
                  ) : (
                    <>No meetings found</>
                  )}
                </>
              ) : (
                <>
                  Showing {table.getFilteredRowModel().rows.length} of{' '}
                  {meetings.length} meetings
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Meeting Table */}
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
                          <Badge>{row.subRows.length}</Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }

                // Regular meeting row
                const meeting = row.original
                const isInstance = meeting.type === 'instance'
                const meetingId = isInstance
                  ? `${(meeting as MeetingInstanceWithRelations).meeting.id}-${meeting.id}`
                  : meeting.id

                return (
                  <TableRow
                    key={row.id}
                    className='hover:bg-accent/50 cursor-pointer'
                    onClick={() => handleRowClick(meetingId, isInstance)}
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
                  No meetings found.
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
        <>
          {/* Backdrop to close menu */}
          <div
            className='fixed inset-0 z-40'
            onClick={() =>
              setContextMenu(prev => ({ ...prev, visible: false }))
            }
          />

          {/* Context Menu */}
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
                const href = contextMenu.isInstance
                  ? `/meetings/${contextMenu.meetingId.split('-')[0]}/instances/${contextMenu.meetingId.split('-')[1]}`
                  : `/meetings/${contextMenu.meetingId}`
                router.push(href)
                setContextMenu(prev => ({ ...prev, visible: false }))
              }}
            >
              <Eye className='w-4 h-4' />
              View
            </button>
            <button
              className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
              onClick={() => {
                const href = contextMenu.isInstance
                  ? `/meetings/${contextMenu.meetingId.split('-')[0]}/instances/${contextMenu.meetingId.split('-')[1]}/edit`
                  : `/meetings/${contextMenu.meetingId}/edit`
                router.push(href)
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
                setDeleteTargetId(contextMenu.meetingId)
                setShowDeleteModal(true)
              }}
            >
              <Trash2 className='w-4 h-4' />
              Delete
            </button>
          </div>
        </>
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
            return handleDeleteConfirm(deleteTargetId, contextMenu.isInstance)
          }
        }}
        title={
          contextMenu.isInstance ? 'Delete Meeting Instance' : 'Delete Meeting'
        }
        entityName={contextMenu.isInstance ? 'meeting instance' : 'meeting'}
      />
    </div>
  )
}
