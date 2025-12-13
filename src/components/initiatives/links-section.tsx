'use client'

import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { SimpleLinkList } from '@/components/links/link-list'
import { LinkIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { EntityLink } from '@/components/links/link-list'

interface LinksSectionProps {
  links: EntityLink[]
  entityType: string
  entityId: string
}

export function LinksSection({
  links,
  entityType,
  entityId,
}: LinksSectionProps) {
  const router = useRouter()

  const handleLinksUpdate = () => {
    router.refresh()
  }

  return (
    <PageSection header={<SectionHeader icon={LinkIcon} title='Links' />}>
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
