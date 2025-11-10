'use client'

import { useState } from 'react'
import { Link } from '@/components/ui/link'
import { Rag } from '@/components/rag'
import { CheckInModal } from '@/components/checkin-modal'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { DeleteModal } from '@/components/common/delete-modal'
import { deleteCheckIn } from '@/lib/actions/checkin'
import { toast } from 'sonner'
import { CheckCircle, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { SimpleListContainer } from '@/components/common/simple-list-container'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'
import { formatDistanceToNow } from 'date-fns'

interface InitiativeCheckInsProps {
  initiativeId: string
  initiativeTitle: string
  checkIns: Array<{
    id: string
    weekOf: string
    rag: string
    confidence: number
    summary: string | null
    blockers: string | null
    nextSteps: string | null
    createdAt: string
    createdBy: {
      id: string
      name: string
    }
  }>
}

export function InitiativeCheckIns({
  initiativeId,
  initiativeTitle,
  checkIns,
}: InitiativeCheckInsProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingCheckIn, setEditingCheckIn] = useState<
    (typeof checkIns)[0] | null
  >(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleFormSuccess = () => {
    setShowNewForm(false)
    setEditingCheckIn(null)
    // The page will be revalidated by the server action
  }

  const handleEditOpenChange = (open: boolean) => {
    if (!open) {
      setEditingCheckIn(null)
    }
  }

  const handleDelete = async (checkInId: string) => {
    setIsDeleting(true)
    try {
      await deleteCheckIn(checkInId)
      toast.success('Check-in deleted successfully')
      handleFormSuccess()
    } catch (error) {
      console.error('Error deleting check-in:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete check-in'
      )
    } finally {
      setIsDeleting(false)
      setDeleteModalOpen(null)
    }
  }

  // Truncate text with ellipsis
  const truncateText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) {
      return text || ''
    }
    // Find the last space before maxLength to avoid cutting words
    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    return lastSpace > 0
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...'
  }

  const formatWeekOf = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const renderCheckInItem = (checkIn: (typeof checkIns)[0]) => {
    const date = new Date(checkIn.createdAt)
    const truncatedSummary = truncateText(checkIn.summary || '', 150)

    return (
      <SimpleListItem
        key={checkIn.id}
        onClick={() => setEditingCheckIn(checkIn)}
      >
        <div className='flex items-start gap-3 flex-1 min-w-0'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1'>
              <h3 className='font-medium text-sm'>
                Week of {formatWeekOf(checkIn.weekOf)}
              </h3>
            </div>

            {truncatedSummary && (
              <p className='text-sm text-foreground mb-2 line-clamp-2'>
                {truncatedSummary}
              </p>
            )}

            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Rag rag={checkIn.rag} />
              <span>{checkIn.confidence}% confidence</span>
              <span>•</span>
              <span>
                Created by{' '}
                <Link
                  href={`/people/${checkIn.createdBy.id}`}
                  className='text-primary hover:opacity-90'
                  onClick={e => e.stopPropagation()}
                >
                  {checkIn.createdBy.name}
                </Link>
              </span>
              <span>•</span>
              <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0'
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                setEditingCheckIn(checkIn)
              }}
            >
              <Edit className='h-4 w-4 mr-2' />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                setDeleteModalOpen(checkIn.id)
              }}
              className='text-destructive'
            >
              <Trash2 className='h-4 w-4 mr-2' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SimpleListItem>
    )
  }

  return (
    <PageSection
      header={
        <SectionHeader
          icon={CheckCircle}
          title='Check-ins'
          action={
            <Button
              onClick={() => setShowNewForm(true)}
              variant='outline'
              size='sm'
            >
              <Plus className='h-4 w-4' />
              Add Check-in
            </Button>
          }
        />
      }
    >
      <SimpleListContainer>
        <SimpleListItemsContainer
          isEmpty={checkIns.length === 0}
          emptyStateText='No check-ins yet.'
        >
          {checkIns.map(renderCheckInItem)}
        </SimpleListItemsContainer>
      </SimpleListContainer>

      {/* New Check-in Modal */}
      <CheckInModal
        initiativeId={initiativeId}
        initiativeTitle={initiativeTitle}
        open={showNewForm}
        onOpenChange={setShowNewForm}
        onSuccess={handleFormSuccess}
      />

      {/* Edit Check-in Modal */}
      {editingCheckIn && (
        <CheckInModal
          initiativeId={initiativeId}
          initiativeTitle={initiativeTitle}
          checkIn={{
            ...editingCheckIn,
            summary: editingCheckIn.summary || '',
          }}
          open={!!editingCheckIn}
          onOpenChange={handleEditOpenChange}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <DeleteModal
          isOpen={!!deleteModalOpen}
          onClose={() => setDeleteModalOpen(null)}
          onConfirm={() => {
            if (deleteModalOpen) {
              void handleDelete(deleteModalOpen)
            }
          }}
          title='Delete Check-in'
          entityName='check-in'
          isLoading={isDeleting}
        />
      )}
    </PageSection>
  )
}
