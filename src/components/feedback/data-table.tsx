'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
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
import { Eye, Edit, Trash2, Search, Filter, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { usePeopleCache } from '@/hooks/use-organization-cache'
import { useFeedback } from '@/hooks/use-feedback'
import { createFeedbackColumns } from './columns'
import { DeleteModal } from '@/components/common/delete-modal'
import { FeedbackDialog } from './feedback-dialog'
import { deleteFeedback } from '@/lib/actions/feedback'
import type { FeedbackListItem } from '@/types/api'
import { dataTableStyles } from '@/components/common/data-table-styles'

interface FeedbackDataTableProps {
  onFeedbackUpdate?: () => void
  hideFilters?: boolean
  // Pagination options
  page?: number
  limit?: number
  enablePagination?: boolean
  // Immutable filters that cannot be changed by user interaction
  immutableFilters?: {
    search?: string
    fromPersonId?: string
    aboutPersonId?: string
    kind?: string
    isPrivate?: string
    startDate?: string
    endDate?: string
  }
}

export function FeedbackDataTable({
  onFeedbackUpdate: _onFeedbackUpdate,
  hideFilters = false,
  limit = 20,
  enablePagination = false,
  immutableFilters,
}: FeedbackDataTableProps) {
  const router = useRouter()
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    feedbackId: string
  }>({
    visible: false,
    x: 0,
    y: 0,
    feedbackId: '',
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [selectedFeedback, setSelectedFeedback] =
    useState<FeedbackListItem | null>(null)

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    fromPersonId: 'all',
    aboutPersonId: 'all',
    kind: 'all',
    isPrivate: 'all',
    startDate: '',
    endDate: '',
  })

  // Debounced search state
  const [searchInput, setSearchInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: limit,
  })

  // Get current user's session
  const { status: sessionStatus } = useSession()

  // Don't fetch data if we're waiting for session
  const shouldFetch = sessionStatus !== 'loading'

  // Use the people cache for filter dropdowns
  const { people } = usePeopleCache()

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filters.search) {
        setIsSearching(true)
        setFilters(prev => ({ ...prev, search: searchInput }))
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchInput, filters.search])

  // Memoize filters to prevent unnecessary refetches
  const memoizedFilters = useMemo(
    () => ({
      search: filters.search,
      fromPersonId: filters.fromPersonId === 'all' ? '' : filters.fromPersonId,
      aboutPersonId:
        filters.aboutPersonId === 'all' ? '' : filters.aboutPersonId,
      kind: filters.kind === 'all' ? '' : filters.kind,
      isPrivate: filters.isPrivate === 'all' ? '' : filters.isPrivate,
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters)]
  )

  const memoizedImmutableFilters = useMemo(
    () => immutableFilters || {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(immutableFilters)]
  )

  // Fetch data using useFeedback hook
  const {
    data: feedbackData,
    loading,
    error,
    refetch,
  } = useFeedback({
    page: enablePagination ? pagination.pageIndex + 1 : 1,
    limit: enablePagination ? pagination.pageSize : 1000,
    filters: memoizedFilters,
    immutableFilters: memoizedImmutableFilters,
    enabled: shouldFetch,
  })

  // Reset searching state when API call completes
  useEffect(() => {
    if (!loading && isSearching) {
      setIsSearching(false)
    }
  }, [loading, isSearching])

  const feedback = useMemo(
    () => feedbackData?.feedback || [],
    [feedbackData?.feedback]
  )
  const currentPersonId = feedbackData?.currentPersonId

  // Check if there are active filters (excluding immutable ones)
  const hasActiveFilters = useMemo(() => {
    return (
      (!immutableFilters?.search && filters.search !== '') ||
      (!immutableFilters?.fromPersonId && filters.fromPersonId !== 'all') ||
      (!immutableFilters?.aboutPersonId && filters.aboutPersonId !== 'all') ||
      (!immutableFilters?.kind && filters.kind !== 'all') ||
      (!immutableFilters?.isPrivate && filters.isPrivate !== 'all') ||
      (!immutableFilters?.startDate && filters.startDate !== '') ||
      (!immutableFilters?.endDate && filters.endDate !== '')
    )
  }, [filters, immutableFilters])

  // Check if there are any changeable (non-immutable) filters
  const hasChangeableFilters = useMemo(() => {
    return (
      !immutableFilters?.fromPersonId ||
      !immutableFilters?.aboutPersonId ||
      !immutableFilters?.kind ||
      !immutableFilters?.isPrivate ||
      (!immutableFilters?.startDate && !immutableFilters?.endDate)
    )
  }, [immutableFilters])

  const handleDeleteClick = (feedbackId: string) => {
    setDeleteTargetId(feedbackId)
    setShowDeleteModal(true)
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return

    try {
      await deleteFeedback(deleteTargetId)
      toast.success('Feedback deleted successfully')
      setShowDeleteModal(false)
      setDeleteTargetId(null)
      await refetch()
    } catch (error) {
      console.error('Failed to delete feedback:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete feedback'
      )
    }
  }

  const handleRowClick = (feedbackId: string) => {
    const feedbackItem = feedback.find(item => item.id === feedbackId)
    if (feedbackItem) {
      setSelectedFeedback(feedbackItem)
      setShowFeedbackDialog(true)
    }
  }

  const handleButtonClick = (e: React.MouseEvent, feedbackId: string) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      visible: true,
      x: rect.right - 160,
      y: rect.bottom + 4,
      feedbackId,
    })
  }

  const canEdit = (feedbackItem: FeedbackListItem) =>
    feedbackItem.fromId === currentPersonId

  const columns = createFeedbackColumns({
    onButtonClick: handleButtonClick,
    onRowClick: handleRowClick,
  })

  const table = useReactTable({
    data: feedback,
    columns,
    state: {
      columnFilters,
      pagination: enablePagination ? pagination : undefined,
    },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: enablePagination ? setPagination : undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    manualPagination: enablePagination, // Use server-side pagination
    pageCount:
      enablePagination && feedbackData?.pagination
        ? feedbackData.pagination.totalPages
        : undefined,
  })

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }))
      }
    }

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.visible])

  const clearFilters = () => {
    setSearchInput('')
    setFilters({
      search: '',
      fromPersonId: 'all',
      aboutPersonId: 'all',
      kind: 'all',
      isPrivate: 'all',
      startDate: '',
      endDate: '',
    })
  }

  if (error) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-destructive'>Error loading feedback: {error}</div>
      </div>
    )
  }

  return (
    <div className={dataTableStyles.container}>
      {/* Filter Controls */}
      {!hideFilters && (
        <div>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-2 flex-1'>
              {/* Search Input - Hide if immutable search filter */}
              {!immutableFilters?.search && (
                <div className='relative flex-1 max-w-sm'>
                  <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search feedback...'
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

              {/* Additional Filters Button - Hide if no changeable filters */}
              {hasChangeableFilters && (
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
                        <h3 className='font-medium'>Filter Feedback</h3>
                        <button
                          onClick={clearFilters}
                          className='text-sm text-muted-foreground hover:text-foreground'
                        >
                          Clear all
                        </button>
                      </div>

                      <div className='space-y-4'>
                        {/* From Person Filter - Hide if immutable */}
                        {!immutableFilters?.fromPersonId && (
                          <div className='space-y-2'>
                            <label className='text-sm font-medium'>
                              Written by
                            </label>
                            <Select
                              value={filters.fromPersonId}
                              onValueChange={value =>
                                setFilters(prev => ({
                                  ...prev,
                                  fromPersonId: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='All people' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='all'>All people</SelectItem>
                                {people.map(person => (
                                  <SelectItem key={person.id} value={person.id}>
                                    {person.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* About Person Filter - Hide if immutable */}
                        {!immutableFilters?.aboutPersonId && (
                          <div className='space-y-2'>
                            <label className='text-sm font-medium'>About</label>
                            <Select
                              value={filters.aboutPersonId}
                              onValueChange={value =>
                                setFilters(prev => ({
                                  ...prev,
                                  aboutPersonId: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='All people' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='all'>All people</SelectItem>
                                {people.map(person => (
                                  <SelectItem key={person.id} value={person.id}>
                                    {person.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Kind Filter - Hide if immutable */}
                        {!immutableFilters?.kind && (
                          <div className='space-y-2'>
                            <label className='text-sm font-medium'>Type</label>
                            <Select
                              value={filters.kind}
                              onValueChange={value =>
                                setFilters(prev => ({ ...prev, kind: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='All types' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='all'>All types</SelectItem>
                                <SelectItem value='praise'>Praise</SelectItem>
                                <SelectItem value='concern'>Concern</SelectItem>
                                <SelectItem value='note'>Note</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Privacy Filter - Hide if immutable */}
                        {!immutableFilters?.isPrivate && (
                          <div className='space-y-2'>
                            <label className='text-sm font-medium'>
                              Visibility
                            </label>
                            <Select
                              value={filters.isPrivate}
                              onValueChange={value =>
                                setFilters(prev => ({
                                  ...prev,
                                  isPrivate: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='All feedback' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='all'>
                                  All feedback
                                </SelectItem>
                                <SelectItem value='false'>
                                  Public only
                                </SelectItem>
                                <SelectItem value='true'>
                                  Private only
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Date Range - Hide if immutable */}
                        {!immutableFilters?.startDate &&
                          !immutableFilters?.endDate && (
                            <div className='grid grid-cols-2 gap-2'>
                              <div>
                                <label className='text-sm font-medium mb-2 block'>
                                  From date
                                </label>
                                <Input
                                  type='date'
                                  value={filters.startDate}
                                  onChange={e =>
                                    setFilters(prev => ({
                                      ...prev,
                                      startDate: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div>
                                <label className='text-sm font-medium mb-2 block'>
                                  To date
                                </label>
                                <Input
                                  type='date'
                                  value={filters.endDate}
                                  onChange={e =>
                                    setFilters(prev => ({
                                      ...prev,
                                      endDate: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className='text-sm text-muted-foreground'>
              {enablePagination && feedbackData?.pagination ? (
                <>
                  {feedbackData.pagination.totalCount > 0 ? (
                    <>
                      Showing{' '}
                      {(feedbackData.pagination.page - 1) *
                        feedbackData.pagination.limit +
                        1}{' '}
                      to{' '}
                      {Math.min(
                        feedbackData.pagination.page *
                          feedbackData.pagination.limit,
                        feedbackData.pagination.totalCount
                      )}{' '}
                      of {feedbackData.pagination.totalCount} items
                    </>
                  ) : (
                    'No feedback found'
                  )}
                </>
              ) : (
                `${feedback.length} ${feedback.length === 1 ? 'item' : 'items'}`
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={dataTableStyles.tableWrapper}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
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
                  className={dataTableStyles.body.emptyCell}
                >
                  <div className='flex items-center justify-center'>
                    <div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => {
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => handleRowClick(row.original.id)}
                    className={dataTableStyles.body.row}
                  >
                    {row.getVisibleCells().map(cell => {
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
                  className={dataTableStyles.body.emptyCell}
                >
                  {hasActiveFilters
                    ? 'No feedback matches your filters.'
                    : 'No feedback found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {enablePagination && feedbackData?.pagination && (
        <div className='flex items-center justify-between px-2'>
          <div className='flex-1 text-sm text-muted-foreground'>
            Page {feedbackData.pagination.page} of{' '}
            {feedbackData.pagination.totalPages}
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
            </Button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className='fixed bg-popover border border-border rounded-md shadow-md py-1 z-50 min-w-[160px]'
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const feedbackItem = feedback.find(
                item => item.id === contextMenu.feedbackId
              )
              if (feedbackItem) {
                setSelectedFeedback(feedbackItem)
                setShowFeedbackDialog(true)
              }
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
            className='w-full px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 text-left'
          >
            <Eye className='h-4 w-4' />
            View
          </button>
          {(() => {
            const feedbackItem = feedback.find(
              item => item.id === contextMenu.feedbackId
            )
            return feedbackItem && canEdit(feedbackItem) ? (
              <>
                <button
                  onClick={() => {
                    router.push(
                      `/people/${feedbackItem.about.id}/feedback/${feedbackItem.id}/edit`
                    )
                    setContextMenu(prev => ({ ...prev, visible: false }))
                  }}
                  className='w-full px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 text-left'
                >
                  <Edit className='h-4 w-4' />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(feedbackItem.id)}
                  className='w-full px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 text-destructive text-left'
                >
                  <Trash2 className='h-4 w-4' />
                  Delete
                </button>
              </>
            ) : null
          })()}
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTargetId(null)
        }}
        onConfirm={handleDeleteConfirm}
        title='Delete Feedback'
        description='Are you sure you want to delete this feedback? This action cannot be undone.'
      />

      {/* Feedback Dialog */}
      {showFeedbackDialog && selectedFeedback && (
        <FeedbackDialog
          feedback={selectedFeedback}
          isOpen={showFeedbackDialog}
          onClose={() => {
            setShowFeedbackDialog(false)
            setSelectedFeedback(null)
          }}
          canEdit={canEdit(selectedFeedback)}
          onRefresh={refetch}
        />
      )}
    </div>
  )
}
