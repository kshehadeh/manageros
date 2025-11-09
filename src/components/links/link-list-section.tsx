'use client'

import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { SimpleLinkList } from './link-list'
import { AddLinkModal } from './add-link-modal'
import { Link as LinkIcon } from 'lucide-react'
import type { EntityLink } from './link-list'

interface LinkListSectionProps {
  links: EntityLink[]
  entityType: string
  entityId: string
  title?: string
  emptyStateText?: string
  onLinksUpdate?: () => void
  className?: string
  canEdit?: boolean
}

export function LinkListSection({
  links,
  entityType,
  entityId,
  title = 'Links',
  emptyStateText = 'No links added yet.',
  onLinksUpdate,
  className,
  canEdit = false,
}: LinkListSectionProps) {
  return (
    <PageSection
      header={
        <SectionHeader
          icon={LinkIcon}
          title={title}
          action={
            canEdit ? (
              <AddLinkModal
                entityType={entityType}
                entityId={entityId}
                onLinkAdded={onLinksUpdate}
              />
            ) : undefined
          }
        />
      }
      className={className}
    >
      <SimpleLinkList
        links={links}
        entityType={entityType}
        entityId={entityId}
        variant='compact'
        emptyStateText={emptyStateText}
        onLinksUpdate={onLinksUpdate}
      />
    </PageSection>
  )
}
