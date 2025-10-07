'use client'

import { useState, useMemo } from 'react'
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Search,
  Filter,
  Calendar,
  User as UserIcon,
} from 'lucide-react'
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
import Link from 'next/link'
import { deleteFeedback } from '@/lib/actions/feedback'
import { toast } from 'sonner'
import { FeedbackDialog } from './feedback-dialog'
import { DeleteModal } from '@/components/common/delete-modal'
import { getKindLabel } from '@/lib/utils/feedback'
interface Person {
  id: string
  name: string
  email: string | null
  role: string | null
}

interface FilterState {
  keyword: string
  fromPersonId: string
  aboutPersonId: string
  kind: string
  isPrivate: string
  dateRange: string
  startDate: string
  endDate: string
}

interface FeedbackWithRelations {
  id: string
  aboutId: string
  fromId: string
  kind: string
  isPrivate: boolean
  body: string
  createdAt: string
  about: {
    id: string
    name: string
  }
  from: {
    id: string
    name: string
  }
}

interface FeedbackTableProps {
  feedback: FeedbackWithRelations[]
  people: Person[]
  currentUserId?: string
  hideFilters?: boolean
  onRefresh?: () => void
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  feedbackId: string
  triggerType: 'rightClick' | 'button'
}

export function FeedbackTable({
  feedback,
  people,
  currentUserId,
  hideFilters = false,
  onRefresh,
}: FeedbackTableProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    feedbackId: '',
    triggerType: 'rightClick',
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [selectedFeedback, setSelectedFeedback] =
    useState<FeedbackWithRelations | null>(null)

  // Initialize filters from URL params or defaults
  const initialFilters: FilterState = {
    keyword: '',
    fromPersonId: 'all',
    aboutPersonId: 'all',
    kind: 'all',
    isPrivate: 'all',
    dateRange: 'all',
    startDate: '',
    endDate: '',
  }

  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [showFilters, setShowFilters] = useState(false)

  // Filter feedback based on current filter state
  const filteredFeedback = useMemo(() => {
    return feedback.filter(feedbackItem => {
      // Keyword filter (searches feedback body)
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        const bodyMatch = feedbackItem.body.toLowerCase().includes(keyword)
        const fromNameMatch = feedbackItem.from.name
          .toLowerCase()
          .includes(keyword)
        const aboutNameMatch = feedbackItem.about.name
          .toLowerCase()
          .includes(keyword)
        if (!bodyMatch && !fromNameMatch && !aboutNameMatch) return false
      }

      // From person filter
      if (filters.fromPersonId && filters.fromPersonId !== 'all') {
        if (feedbackItem.fromId !== filters.fromPersonId) return false
      }

      // About person filter
      if (filters.aboutPersonId && filters.aboutPersonId !== 'all') {
        if (feedbackItem.aboutId !== filters.aboutPersonId) return false
      }

      // Kind filter
      if (filters.kind && filters.kind !== 'all') {
        if (feedbackItem.kind !== filters.kind) return false
      }

      // Privacy filter
      if (filters.isPrivate && filters.isPrivate !== 'all') {
        const isPrivateValue = filters.isPrivate === 'true'
        if (feedbackItem.isPrivate !== isPrivateValue) return false
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const feedbackDate = new Date(feedbackItem.createdAt)
        const startDate = filters.startDate ? new Date(filters.startDate) : null
        const endDate = filters.endDate ? new Date(filters.endDate) : null

        if (startDate && feedbackDate < startDate) return false
        if (endDate && feedbackDate > endDate) return false
      }

      return true
    })
  }, [feedback, filters])

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
  }

  const clearFilters = () => {
    setFilters(initialFilters)
  }

  const handleDelete = async (feedbackId: string) => {
    setDeletingId(feedbackId)
    try {
      await deleteFeedback(feedbackId)
      toast.success('Feedback deleted successfully')
      onRefresh?.()
    } catch (error) {
      console.error('Failed to delete feedback:', error)
      toast.error('Failed to delete feedback. Please try again.')
    } finally {
      setDeletingId(null)
      setShowDeleteModal(false)
      setDeleteTargetId(null)
    }
  }

  const openFeedbackDialog = (feedback: FeedbackWithRelations) => {
    setSelectedFeedback(feedback)
    setShowFeedbackDialog(true)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getExcerpt = (content: string, maxLength: number = 120) => {
    if (!content) return 'No content available'
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  const hasActiveFilters = useMemo(() => {
    const hasActive =
      filters.keyword !== '' ||
      filters.fromPersonId !== 'all' ||
      filters.aboutPersonId !== 'all' ||
      filters.kind !== 'all' ||
      filters.isPrivate !== 'all' ||
      filters.dateRange !== 'all' ||
      filters.startDate !== '' ||
      filters.endDate !== ''

    return hasActive
  }, [filters])

  const canEdit = (feedbackItem: FeedbackWithRelations) =>
    feedbackItem.fromId === currentUserId ||
    feedbackItem.from.id === currentUserId

  return (
    <>
      {/* Search and Filter Bar */}
      {!hideFilters && (
        <div className='flex items-center gap-4 mb-4'>
          <div className='relative flex-1 max-w-sm'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
            <Input
              placeholder='Search feedback...'
              value={filters.keyword}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  keyword: e.target.value,
                }))
              }
              className='pl-10'
            />
          </div>

          <div className='relative'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowFilters(!showFilters)}
              className='flex items-center gap-2'
            >
              <Filter className='h-4 w-4' />
              Filters
              {hasActiveFilters && (
                <div className='h-2 w-2 bg-primary rounded-full' />
              )}
            </Button>

            {/* Filter Popup */}
            {showFilters && (
              <div className='absolute top-full mt-2 right-0 z-50 w-80 bg-popover border border-border rounded-md shadow-lg p-4'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='font-medium'>Filter Feedback</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className='text-sm text-muted-foreground hover:text-foreground'
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className='space-y-4'>
                    {/* From Person Filter */}
                    <div>
                      <label className='text-sm font-medium mb-2 block'>
                        Written by
                      </label>
                      <Select
                        value={filters.fromPersonId}
                        onValueChange={value =>
                          updateFilters({ fromPersonId: value })
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

                    {/* About Person Filter */}
                    <div>
                      <label className='text-sm font-medium mb-2 block'>
                        About
                      </label>
                      <Select
                        value={filters.aboutPersonId}
                        onValueChange={value =>
                          updateFilters({ aboutPersonId: value })
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

                    {/* Kind Filter */}
                    <div>
                      <label className='text-sm font-medium mb-2 block'>
                        Type
                      </label>
                      <Select
                        value={filters.kind}
                        onValueChange={value => updateFilters({ kind: value })}
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

                    {/* Privacy Filter */}
                    <div>
                      <label className='text-sm font-medium mb-2 block'>
                        Visibility
                      </label>
                      <Select
                        value={filters.isPrivate}
                        onValueChange={value =>
                          updateFilters({ isPrivate: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='All feedback' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>All feedback</SelectItem>
                          <SelectItem value='false'>Public only</SelectItem>
                          <SelectItem value='true'>Private only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Range */}
                    <div className='grid grid-cols-2 gap-2'>
                      <div>
                        <label className='text-sm font-medium mb-2 block'>
                          From date
                        </label>
                        <Input
                          type='date'
                          value={filters.startDate}
                          onChange={e =>
                            updateFilters({ startDate: e.target.value })
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
                            updateFilters({ endDate: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-accent/50'>
              <TableHead className='text-muted-foreground'>About</TableHead>
              <TableHead className='text-muted-foreground'>
                <div className='flex items-center gap-2'>
                  <UserIcon className='h-4 w-4' />
                  Written by
                </div>
              </TableHead>
              <TableHead className='text-muted-foreground'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  Date
                </div>
              </TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead className='text-muted-foreground w-[50px]'>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeedback.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-center py-8 text-muted-foreground'
                >
                  {hasActiveFilters
                    ? 'No feedback matches your filters.'
                    : 'No feedback found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredFeedback.map(feedbackItem => (
                <TableRow
                  key={feedbackItem.id}
                  className='group hover:bg-accent/50'
                >
                  <TableCell className='text-foreground'>
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-2'>
                        <LinkSelector
                          href={`/people/${feedbackItem.about.id}`}
                          className='text-primary hover:text-primary/90 transition-colors'
                        >
                          {feedbackItem.about.name}
                        </LinkSelector>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-muted-foreground'>
                          {getKindLabel(feedbackItem.kind)}
                        </span>
                        {feedbackItem.isPrivate && (
                          <span className='text-xs text-muted-foreground'>
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {feedbackItem.from.name}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {formatDate(feedbackItem.createdAt)}
                  </TableCell>
                  <TableCell className='py-3'>
                    <button
                      onClick={() => openFeedbackDialog(feedbackItem)}
                      className='text-left text-sm hover:text-primary transition-colors'
                    >
                      <div className='line-clamp-2'>
                        {getExcerpt(feedbackItem.body, 150)}
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className='hidden md:table-cell py-2 px-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0'
                      onClick={e => {
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        setContextMenu({
                          visible: true,
                          x: rect.right - 160, // Position menu to the left of the button
                          y: rect.bottom + 4, // Position menu below the button
                          feedbackId: feedbackItem.id,
                          triggerType: 'button',
                        })
                      }}
                    >
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
              const feedbackItem = filteredFeedback.find(
                item => item.id === contextMenu.feedbackId
              )
              if (feedbackItem) {
                openFeedbackDialog(feedbackItem)
              }
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Eye className='w-4 h-4' />
            View
          </button>
          {(() => {
            const feedbackItem = filteredFeedback.find(
              item => item.id === contextMenu.feedbackId
            )
            return feedbackItem && canEdit(feedbackItem) ? (
              <>
                <LinkSelector
                  href={`/people/${feedbackItem.about.id}/feedback/${feedbackItem.id}/edit`}
                  className='flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground'
                  onClick={() =>
                    setContextMenu(prev => ({ ...prev, visible: false }))
                  }
                >
                  <Edit className='w-4 h-4' />
                  Edit
                </LinkSelector>
                <button
                  className='w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center gap-2'
                  onClick={() => {
                    setDeleteTargetId(feedbackItem.id)
                    setShowDeleteModal(true)
                    setContextMenu(prev => ({ ...prev, visible: false }))
                  }}
                  disabled={deletingId === feedbackItem.id}
                >
                  <Trash2 className='w-4 h-4' />
                  {deletingId === feedbackItem.id ? 'Deleting...' : 'Delete'}
                </button>
              </>
            ) : null
          })()}
        </div>
      )}

      {/* Filter Popup Overlay */}
      {showFilters && (
        <div
          className='fixed inset-0 z-40'
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Context Menu Overlay */}
      {contextMenu.visible && (
        <div
          className='fixed inset-0 z-10'
          onClick={() => setContextMenu({ ...contextMenu, visible: false })}
        />
      )}

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
          onRefresh={onRefresh}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTargetId && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setDeleteTargetId(null)
          }}
          onConfirm={() => handleDelete(deleteTargetId)}
          title='Delete Feedback'
          description='Are you sure you want to delete this feedback? This action cannot be undone.'
          isLoading={deletingId === deleteTargetId}
        />
      )}
    </>
  )
}

// Helper component to handle Next.js Link
function LinkSelector({
  children,
  href,
  className,
  ...props
}: {
  children: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
}) {
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  )
}
