'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, ExternalLink, Edit } from 'lucide-react'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import { DeleteModal } from '@/components/common/delete-modal'
import { getIconForUrl, getUrlTitle } from '@/lib/utils/link-icons'
import { deleteEntityLink } from '@/lib/actions/entity-links'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LinkForm } from '@/components/entity-links'
import {
  DeleteMenuItem,
  ContextMenuItem,
} from '@/components/common/context-menu-items'
import { SimpleListContainer } from '@/components/common/simple-list-container'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'

export interface EntityLink {
  id: string
  url: string
  title: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    name: string
    email: string
  }
}

export interface LinkListProps {
  links: EntityLink[]
  variant?: 'compact' | 'full'
  entityType: string
  entityId: string
  emptyStateText?: string
  onLinksUpdate?: () => void
  className?: string
  immutableFilters?: Record<string, unknown>
}

export function SimpleLinkList({
  links,
  variant = 'compact',
  entityType,
  entityId,
  emptyStateText = 'No links found.',
  onLinksUpdate,
  className = '',
  immutableFilters,
}: LinkListProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [editingLink, setEditingLink] = useState<EntityLink | null>(null)
  const router = useRouter()

  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()

  const handleDeleteLink = async () => {
    if (!deleteTargetId) return

    try {
      await deleteEntityLink({ id: deleteTargetId })
      toast.success('Link deleted successfully')
      if (onLinksUpdate) {
        onLinksUpdate()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting link:', error)
      toast.error('Failed to delete link')
    } finally {
      setShowDeleteModal(false)
      setDeleteTargetId(null)
    }
  }

  const handleEditLink = (link: EntityLink) => {
    setEditingLink(link)
  }

  const handleFormSuccess = () => {
    setEditingLink(null)
    if (onLinksUpdate) {
      onLinksUpdate()
    } else {
      router.refresh()
    }
  }

  const handleFormCancel = () => {
    setEditingLink(null)
  }

  // Filter links based on immutable filters
  const filterLinks = (linksToFilter: EntityLink[]) => {
    if (!immutableFilters || Object.keys(immutableFilters).length === 0) {
      return linksToFilter
    }

    return linksToFilter.filter(link => {
      return Object.entries(immutableFilters).every(([key, value]) => {
        // For any filters, try to match against link properties
        return (link as unknown as Record<string, unknown>)[key] === value
      })
    })
  }

  // Apply filters to links
  const visibleLinks = filterLinks(links)

  const renderLinkItem = (link: EntityLink) => {
    const IconComponent = getIconForUrl(link.url)
    const urlTitle = link.title || getUrlTitle(link.url)

    return (
      <SimpleListItem key={link.id}>
        <a
          href={link.url}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-start gap-3 flex-1 min-w-0'
        >
          <div className='shrink-0 mt-0.5'>
            <div className='w-8 h-8 rounded-md bg-muted flex items-center justify-center'>
              <IconComponent className='w-4 h-4 text-muted-foreground' />
            </div>
          </div>
          <div className='flex-1 min-w-0'>
            <h3 className='font-medium text-sm truncate mb-1'>{urlTitle}</h3>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              {link.description && variant === 'full' && (
                <>
                  <span className='truncate'>{link.description}</span>
                  <span>•</span>
                </>
              )}
              <span className='truncate'>
                Added{' '}
                {formatDistanceToNow(new Date(link.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
          <ExternalLink className='h-4 w-4 text-muted-foreground shrink-0 ml-2' />
        </a>

        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0 hover:bg-muted shrink-0'
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            handleButtonClick(e, link.id)
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
          isEmpty={visibleLinks.length === 0}
          emptyStateText={emptyStateText}
        >
          {visibleLinks.map(renderLinkItem)}
        </SimpleListItemsContainer>
      </SimpleListContainer>

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => {
          const link = links.find(l => l.id === entityId)
          if (!link) return null

          return (
            <>
              <ContextMenuItem
                onClick={() => {
                  handleEditLink(link)
                  close()
                }}
                icon={<Edit className='h-4 w-4' />}
              >
                Edit
              </ContextMenuItem>
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
        onConfirm={handleDeleteLink}
        title='Delete Link'
        entityName='link'
      />

      {/* Edit Link Dialog */}
      <Dialog open={!!editingLink} onOpenChange={() => setEditingLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>Update the link details.</DialogDescription>
          </DialogHeader>
          {editingLink && (
            <LinkForm
              entityType={entityType}
              entityId={entityId}
              initialData={editingLink}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
