'use client'

import React from 'react'
import { SimpleLinkList } from '@/components/links/link-list'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Link as LinkIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EntityLink {
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

interface TaskSidebarProps {
  links: EntityLink[]
  entityId: string
}

export function TaskSidebar({ links, entityId }: TaskSidebarProps) {
  const router = useRouter()

  return (
    <div className='w-full lg:w-80'>
      {/* Links Section */}
      <PageSection header={<SectionHeader icon={LinkIcon} title='Links' />}>
        <SimpleLinkList
          links={links}
          entityType='Task'
          entityId={entityId}
          variant='compact'
          emptyStateText='No links added yet.'
          onLinksUpdate={() => router.refresh()}
        />
      </PageSection>
    </div>
  )
}
