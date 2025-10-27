'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { Handshake, Eye, MoreHorizontal, Plus, Calendar } from 'lucide-react'
import Link from 'next/link'
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
  showAddButton?: boolean
  viewAllHref?: string
  viewAllLabel?: string
  emptyStateText?: string
  onOneOnOneUpdate?: () => void
  className?: string
  immutableFilters?: Record<string, unknown>
}

export function SimpleOneOnOneList({
  oneOnOnes,
  title = '1-on-1s',
  showAddButton = false,
  viewAllHref,
  viewAllLabel = 'View All',
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
    return (
      <div
        key={oneOnOne.id}
        className='flex items-center justify-between px-3 py-3 hover:bg-muted/50 transition-colors cursor-pointer group'
        onClick={() => {
          router.push(`/oneonones/${oneOnOne.id}`)
        }}
      >
        <div className='flex items-start gap-3 flex-1 min-w-0'>
          <div className='flex-1 min-w-0'>
            <h3 className='font-medium text-sm truncate mb-1 flex items-center gap-2'>
              <Link
                href={`/people/${oneOnOne.manager.id}`}
                className='link-hover'
                onClick={e => e.stopPropagation()}
              >
                {oneOnOne.manager.name}
              </Link>
              <span className='text-muted-foreground'>↔</span>
              <Link
                href={`/people/${oneOnOne.report.id}`}
                className='link-hover'
                onClick={e => e.stopPropagation()}
              >
                {oneOnOne.report.name}
              </Link>
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
      </div>
    )
  }

  const renderSectionHeader = () => {
    const actions = []

    if (viewAllHref) {
      actions.push(
        <Button asChild variant='outline' size='sm' key='view-all'>
          <Link href={viewAllHref} className='flex items-center gap-2'>
            <Eye className='w-4 h-4' />
            {viewAllLabel}
          </Link>
        </Button>
      )
    }

    if (showAddButton) {
      actions.push(
        <Button
          onClick={() => {
            // TODO: Implement add 1-on-1 modal
            console.log('Add 1-on-1 clicked')
          }}
          variant='outline'
          size='sm'
          key='add-1-on-1'
        >
          <Plus className='h-4 w-4 mr-2' />
          Add 1-on-1
        </Button>
      )
    }

    return (
      <SectionHeader
        icon={Handshake}
        title={title}
        action={actions.length > 0 ? actions : undefined}
      />
    )
  }

  return (
    <>
      <section className={`rounded-xl py-4 -mx-3 px-3 space-y-4 ${className}`}>
        {renderSectionHeader()}

        <div className='space-y-0 divide-y'>
          {visibleOneOnOnes.length === 0 ? (
            <div className='text-neutral-400 text-sm px-3 py-3'>
              {emptyStateText}
            </div>
          ) : (
            visibleOneOnOnes.map(renderOneOnOneItem)
          )}
        </div>
      </section>

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
