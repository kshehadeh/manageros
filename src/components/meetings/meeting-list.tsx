'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import {
  ViewDetailsMenuItem,
  EditMenuItem,
  DeleteMenuItem,
} from '@/components/common/context-menu-items'
import { DeleteModal } from '@/components/common/delete-modal'
import { deleteMeeting } from '@/lib/actions/meeting'
import { toast } from 'sonner'
import { SimpleListContainer } from '@/components/common/simple-list-container'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'

export interface Meeting {
  id: string
  title: string
  description?: string | null
  scheduledAt: Date
  duration?: number | null
  location?: string | null
  isRecurring: boolean
  recurrenceType?: string | null
  isPrivate: boolean
  team?: {
    id: string
    name: string
  } | null
  initiative?: {
    id: string
    title: string
  } | null
  owner?: {
    id: string
    name: string
  } | null
  createdBy?: {
    id: string
    name: string
  } | null
  participants?: Array<{
    person: {
      id: string
      name: string
    }
    status: string
  }>
}

export interface MeetingListProps {
  meetings: Meeting[]
  title?: string
  variant?: 'compact' | 'full'
  showAddButton?: boolean
  initiativeId?: string
  viewAllHref?: string
  viewAllLabel?: string
  emptyStateText?: string
  onMeetingUpdate?: () => void
  className?: string
  immutableFilters?: Record<string, unknown>
  currentTeam?: { id: string; name: string } | null
}

export function MeetingList({
  meetings,
  title: _title = 'Meetings',
  variant = 'compact',
  showAddButton: _showAddButton = false,
  initiativeId: _initiativeId,
  viewAllHref: _viewAllHref,
  viewAllLabel: _viewAllLabel = 'View All',
  emptyStateText = 'No meetings found.',
  onMeetingUpdate,
  className = '',
  immutableFilters,
  currentTeam: _currentTeam,
}: MeetingListProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()

  const handleDeleteMeeting = async () => {
    if (!deleteTargetId) return

    try {
      await deleteMeeting(deleteTargetId)
      toast.success('Meeting deleted successfully')
      onMeetingUpdate?.()
    } catch (error) {
      console.error('Error deleting meeting:', error)
      toast.error('Failed to delete meeting')
    }
  }

  // Filter meetings based on immutable filters
  const filterMeetings = (meetingsToFilter: Meeting[]) => {
    if (!immutableFilters || Object.keys(immutableFilters).length === 0) {
      return meetingsToFilter
    }

    return meetingsToFilter.filter(meeting => {
      return Object.entries(immutableFilters).every(([key, value]) => {
        switch (key) {
          case 'initiativeId':
            return meeting.initiative?.id === value
          case 'teamId':
            return meeting.team?.id === value
          case 'ownerId':
            return meeting.owner?.id === value
          case 'createdById':
            return meeting.createdBy?.id === value
          case 'isRecurring':
            return meeting.isRecurring === value
          case 'isPrivate':
            return meeting.isPrivate === value
          default:
            // For any other filters, try to match against meeting properties
            return (
              (meeting as unknown as Record<string, unknown>)[key] === value
            )
        }
      })
    })
  }

  // Apply filters to meetings
  const visibleMeetings = filterMeetings(meetings)

  const renderMeetingItem = (meeting: Meeting) => {
    const isUpcoming = new Date(meeting.scheduledAt) > new Date()
    const isPast = new Date(meeting.scheduledAt) < new Date()

    return (
      <SimpleListItem key={meeting.id}>
        <Link
          href={`/meetings/${meeting.id}`}
          className='flex items-start gap-3 flex-1 min-w-0'
        >
          <div className='flex-1 min-w-0'>
            <h3 className='font-medium text-sm truncate mb-1'>
              {meeting.title}
            </h3>

            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Badge
                variant={
                  isUpcoming ? 'default' : isPast ? 'secondary' : 'outline'
                }
                className='text-xs'
              >
                {isUpcoming ? 'Upcoming' : isPast ? 'Past' : 'Today'}
              </Badge>

              <span>
                {format(meeting.scheduledAt, 'MMM d, yyyy')} at{' '}
                {format(meeting.scheduledAt, 'h:mm a')}
              </span>

              {meeting.duration && (
                <>
                  <span>•</span>
                  <span>{meeting.duration} min</span>
                </>
              )}

              {meeting.location && variant === 'full' && (
                <>
                  <span>•</span>
                  <span className='truncate'>{meeting.location}</span>
                </>
              )}

              {meeting.isRecurring && (
                <>
                  <span>•</span>
                  <span>Recurring</span>
                </>
              )}
            </div>
          </div>
        </Link>

        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0 hover:bg-muted shrink-0'
          onClick={e => handleButtonClick(e, meeting.id)}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </SimpleListItem>
    )
  }

  return (
    <>
      <SimpleListContainer className={className}>
        <SimpleListItemsContainer
          isEmpty={visibleMeetings.length === 0}
          emptyStateText={emptyStateText}
        >
          {visibleMeetings.map(renderMeetingItem)}
        </SimpleListItemsContainer>
      </SimpleListContainer>

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => {
          const meeting = meetings.find(m => m.id === entityId)
          if (!meeting) return null

          return (
            <>
              <ViewDetailsMenuItem
                entityId={entityId}
                entityType='meetings'
                close={close}
              />
              <EditMenuItem
                entityId={entityId}
                entityType='meetings'
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
          )
        }}
      </ContextMenuComponent>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTargetId(null)
        }}
        onConfirm={handleDeleteMeeting}
        title='Delete Meeting'
        entityName='meeting'
      />
    </>
  )
}
