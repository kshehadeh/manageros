'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { initiativeStatusUtils } from '@/lib/initiative-status'
import type { InitiativeStatus } from '@/lib/initiative-status'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import {
  ViewDetailsMenuItem,
  EditMenuItem,
  DeleteMenuItem,
} from '@/components/common/context-menu-items'
import { DeleteModal } from '@/components/common/delete-modal'
import { RagCircle } from '@/components/rag'
import { SimpleListContainer } from '@/components/common/simple-list-container'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'

export interface Initiative {
  id: string
  title: string
  description?: string | null
  status: string
  rag: string
  team?: {
    id: string
    name: string
  } | null
  updatedAt: Date
  createdAt: Date
  _count?: {
    tasks: number
    checkIns: number
    objectives: number
  }
}

export interface InitiativeListProps {
  initiatives: Initiative[]
  variant?: 'compact' | 'full'
  emptyStateText?: string
  onInitiativeUpdate?: () => void
  className?: string
  immutableFilters?: Record<string, unknown>
}

export function SimpleInitiativeList({
  initiatives,
  variant = 'compact',
  emptyStateText = 'No initiatives found.',
  onInitiativeUpdate,
  className = '',
  immutableFilters,
}: InitiativeListProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()

  const handleDeleteInitiative = async () => {
    if (!deleteTargetId) return

    try {
      // TODO: Implement deleteInitiative action
      // await deleteInitiative(deleteTargetId)
      console.log('Delete initiative:', deleteTargetId)
      onInitiativeUpdate?.()
    } catch (error) {
      console.error('Error deleting initiative:', error)
    }
  }

  // Filter initiatives based on immutable filters
  const filterInitiatives = (initiativesToFilter: Initiative[]) => {
    if (!immutableFilters || Object.keys(immutableFilters).length === 0) {
      return initiativesToFilter
    }

    return initiativesToFilter.filter(initiative => {
      return Object.entries(immutableFilters).every(([key, value]) => {
        switch (key) {
          case 'teamId':
            return initiative.team?.id === value
          case 'status':
            if (Array.isArray(value)) {
              return value.includes(initiative.status)
            }
            return initiative.status === value
          case 'rag':
            return initiative.rag === value
          default:
            // For any other filters, try to match against initiative properties
            return (
              (initiative as unknown as Record<string, unknown>)[key] === value
            )
        }
      })
    })
  }

  // Apply filters to initiatives
  const visibleInitiatives = filterInitiatives(initiatives)

  const renderInitiativeItem = (initiative: Initiative) => {
    const statusVariant = initiativeStatusUtils.getVariant(
      initiative.status as InitiativeStatus
    )

    return (
      <SimpleListItem key={initiative.id}>
        <Link
          href={`/initiatives/${initiative.id}`}
          className='flex items-start gap-3 flex-1 min-w-0'
        >
          <div className='flex-1 min-w-0'>
            <h3 className='font-medium text-sm truncate mb-1'>
              {initiative.title}
            </h3>

            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Badge variant={statusVariant} className='text-xs'>
                {initiativeStatusUtils.getLabel(
                  initiative.status as InitiativeStatus
                )}
              </Badge>
              <RagCircle rag={initiative.rag} size='small' />
              {initiative.team && variant === 'compact' && (
                <>
                  <span className='truncate'>{initiative.team.name}</span>
                  <span>•</span>
                </>
              )}
              {variant === 'full' && initiative._count && (
                <>
                  <span>{initiative._count.objectives} objectives</span>
                  <span>•</span>
                  <span>{initiative._count.tasks} tasks</span>
                  <span>•</span>
                  <span>{initiative._count.checkIns} check-ins</span>
                  <span>•</span>
                </>
              )}
              <span>
                Updated{' '}
                {formatDistanceToNow(initiative.updatedAt, {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </Link>

        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0 hover:bg-muted shrink-0'
          onClick={e => handleButtonClick(e, initiative.id)}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </SimpleListItem>
    )
  }

  return (
    <>
      <SimpleListContainer withSection={false} className={className}>
        <SimpleListItemsContainer
          isEmpty={visibleInitiatives.length === 0}
          emptyStateText={emptyStateText}
        >
          {visibleInitiatives.map(renderInitiativeItem)}
        </SimpleListItemsContainer>
      </SimpleListContainer>

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => {
          const initiative = initiatives.find(i => i.id === entityId)
          if (!initiative) return null

          return (
            <>
              <ViewDetailsMenuItem
                entityId={entityId}
                entityType='initiatives'
                close={close}
              />
              <EditMenuItem
                entityId={entityId}
                entityType='initiatives'
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
        onConfirm={handleDeleteInitiative}
        title='Delete Initiative'
        entityName='initiative'
      />
    </>
  )
}
