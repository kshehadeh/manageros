'use client'

import Link from 'next/link'
import { MeetingDataTable } from '@/components/meetings/data-table'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Button } from '@/components/ui/button'
import { Plus, Calendar } from 'lucide-react'

export function MeetingsPageClient() {
  return (
    <PageContainer>
      <PageHeader
        title='Meetings'
        titleIcon={Calendar}
        helpId='meetings'
        subtitle="Manage and track your organization's meetings"
        actions={
          <Button asChild className='flex items-center gap-2'>
            <Link href='/meetings/new'>
              <Plus className='h-4 w-4' />
              Create Meeting
            </Link>
          </Button>
        }
      />

      <PageContent>
        <PageSection>
          <MeetingDataTable
            settingsId='meetings-list'
            enablePagination={true}
            limit={20}
          />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
