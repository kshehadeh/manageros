'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import {
  ViewDetailsMenuItem,
  EditMenuItem,
  DeleteMenuItem,
} from '@/components/common/context-menu-items'
import { DeleteModal } from '@/components/common/delete-modal'
import { deleteOneOnOne } from '@/lib/actions/oneonone'
import { toast } from 'sonner'
import { SimpleListContainer } from '@/components/common/simple-list-container'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'

export interface OneOnOne {
  id: string
  managerId: string
  reportId: string
  scheduledAt: Date | null
  notes?: string | null
  createdAt?: Date
  updatedAt?: Date
  manager: {
    id: string
    name: string
    email: string | null
  }
  report: {
    id: string
    name: string
    email: string | null
  }
}

export interface OneOnOneListProps {
  oneOnOnes: OneOnOne[]
  title?: string
  variant?: 'compact' | 'full'
  emptyStateText?: string
  onOneOnOneUpdate?: () => void
  className?: string
  immutableFilters?: Record<string, unknown>
}

export function SimpleOneOnOneList({
  oneOnOnes,
  emptyStateText = 'No 1-on-1s found.',
  onOneOnOneUpdate,
  className = '',
  immutableFilters,
}: OneOnOneListProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()

  const handleDeleteOneOnOne = async () => {
    if (!deleteTargetId) return

    try {
      await deleteOneOnOne(deleteTargetId)
      toast.success('1-on-1 deleted successfully')
      onOneOnOneUpdate?.()
    } catch (error) {
      console.error('Error deleting 1-on-1:', error)
      toast.error('Failed to delete 1-on-1')
    }
  }

  // Filter one-on-ones based on immutable filters
  const filterOneOnOnes = (oneOnOnesToFilter: OneOnOne[]) => {
    if (!immutableFilters || Object.keys(immutableFilters).length === 0) {
      return oneOnOnesToFilter
    }

    return oneOnOnesToFilter.filter(oneOnOne => {
      return Object.entries(immutableFilters).every(([key, value]) => {
        switch (key) {
          case 'managerId':
            return oneOnOne.managerId === value
          case 'reportId':
            return oneOnOne.reportId === value
          case 'status':
            // You can add status filtering logic here if needed
            return true
          default:
            return (
              (oneOnOne as unknown as Record<string, unknown>)[key] === value
            )
        }
      })
    })
  }

  // Apply filters to one-on-ones
  const visibleOneOnOnes = filterOneOnOnes(oneOnOnes)

  const renderOneOnOneItem = (oneOnOne: OneOnOne) => {
    const handlePersonClick = (e: React.MouseEvent, personId: string) => {
      e.preventDefault()
      e.stopPropagation()
      router.push(`/people/${personId}`)
    }

    return (
      <SimpleListItem
        key={oneOnOne.id}
        onClick={() => {
          router.push(`/oneonones/${oneOnOne.id}`)
        }}
      >
        <div className='flex items-start gap-3 flex-1 min-w-0'>
          <div className='flex-1 min-w-0'>
            <h3 className='font-medium text-sm truncate mb-1 flex items-center gap-2'>
              <span
                onClick={e => handlePersonClick(e, oneOnOne.manager.id)}
                className='link-hover cursor-pointer'
              >
                {oneOnOne.manager.name}
              </span>
              <span className='text-muted-foreground'>↔</span>
              <span
                onClick={e => handlePersonClick(e, oneOnOne.report.id)}
                className='link-hover cursor-pointer'
              >
                {oneOnOne.report.name}
              </span>
            </h3>

            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Calendar className='h-3 w-3' />
              {oneOnOne.scheduledAt ? (
                <span>
                  {new Date(oneOnOne.scheduledAt).toLocaleDateString()} ({' '}
                  {formatDistanceToNow(new Date(oneOnOne.scheduledAt), {
                    addSuffix: true,
                  })}{' '}
                  )
                </span>
              ) : (
                <span>TBD</span>
              )}
              {oneOnOne.notes && (
                <>
                  <span>•</span>
                  <span className='truncate max-w-xs'>{oneOnOne.notes}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0 hover:bg-muted shrink-0'
          onClick={e => {
            e.stopPropagation()
            handleButtonClick(e, oneOnOne.id)
          }}
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
          isEmpty={visibleOneOnOnes.length === 0}
          emptyStateText={emptyStateText}
        >
          {visibleOneOnOnes.map(renderOneOnOneItem)}
        </SimpleListItemsContainer>
      </SimpleListContainer>

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => {
          const oneOnOne = oneOnOnes.find(o => o.id === entityId)
          if (!oneOnOne) return null

          return (
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
        onConfirm={handleDeleteOneOnOne}
        title='Delete 1-on-1'
        entityName='1-on-1'
      />
    </>
  )
}
