'use client'

import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { SimpleLinkList } from '@/components/links/link-list'
import { AddLinkModal } from '@/components/links/add-link-modal'
import { LinkIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { EntityLink } from '@/components/links/link-list'

interface LinksSectionProps {
  links: EntityLink[]
  entityType: string
  entityId: string
  canEdit: boolean
}

export function LinksSection({
  links,
  entityType,
  entityId,
  canEdit,
}: LinksSectionProps) {
  const router = useRouter()

  const handleLinksUpdate = () => {
    router.refresh()
  }

  return (
    <PageSection
      header={
        <SectionHeader
          icon={LinkIcon}
          title='Links'
          action={
            canEdit ? (
              <AddLinkModal
                entityType={entityType}
                entityId={entityId}
                onLinkAdded={handleLinksUpdate}
              />
            ) : undefined
          }
        />
      }
    >
      <SimpleLinkList
        links={links}
        entityType={entityType}
        entityId={entityId}
        variant='compact'
        emptyStateText='No links added yet.'
        onLinksUpdate={handleLinksUpdate}
        className=''
      />
    </PageSection>
  )
}
