'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import {
  MoreHorizontal,
  Plus,
  Link as LinkIcon,
  ExternalLink,
  Edit,
} from 'lucide-react'
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
  title?: string
  variant?: 'compact' | 'full'
  showAddButton?: boolean
  entityType: string
  entityId: string
  viewAllHref?: string
  viewAllLabel?: string
  emptyStateText?: string
  onLinksUpdate?: () => void
  className?: string
  immutableFilters?: Record<string, unknown>
}

export function SimpleLinkList({
  links,
  title = 'Links',
  variant = 'compact',
  showAddButton = false,
  entityType,
  entityId,
  viewAllHref,
  viewAllLabel = 'View All',
  emptyStateText = 'No links found.',
  onLinksUpdate,
  className = '',
  immutableFilters,
}: LinkListProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
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

  const handleAddLink = () => {
    setIsAddDialogOpen(true)
  }

  const handleEditLink = (link: EntityLink) => {
    setEditingLink(link)
  }

  const handleFormSuccess = () => {
    setIsAddDialogOpen(false)
    setEditingLink(null)
    if (onLinksUpdate) {
      onLinksUpdate()
    } else {
      router.refresh()
    }
  }

  const handleFormCancel = () => {
    setIsAddDialogOpen(false)
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
      <div
        key={link.id}
        className='flex items-center justify-between px-3 py-3 hover:bg-muted/50 transition-colors'
      >
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
      </div>
    )
  }

  const renderSectionHeader = () => {
    const actions = []

    if (viewAllHref) {
      actions.push(
        <Button asChild variant='outline' size='sm' key='view-all'>
          <a href={viewAllHref} className='flex items-center gap-2'>
            <ExternalLink className='w-4 h-4' />
            {viewAllLabel}
          </a>
        </Button>
      )
    }

    if (showAddButton) {
      actions.push(
        <Button
          variant='outline'
          size='sm'
          key='add-link'
          onClick={handleAddLink}
        >
          <Plus className='w-4 h-4 mr-2' />
          Add Link
        </Button>
      )
    }

    return (
      <SectionHeader
        icon={LinkIcon}
        title={title}
        action={actions.length > 0 ? actions : undefined}
      />
    )
  }

  return (
    <>
      <section className={`space-y-4 ${className}`}>
        {title && renderSectionHeader()}

        <div className='space-y-0 divide-y'>
          {visibleLinks.length === 0 ? (
            <div className='text-neutral-400 text-sm px-3 py-3'>
              {emptyStateText}
            </div>
          ) : (
            visibleLinks.map(renderLinkItem)
          )}
        </div>
      </section>

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

      {/* Add Link Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Add a link to provide additional context and resources for this{' '}
              {entityType.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <LinkForm
            entityType={entityType}
            entityId={entityId}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

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
