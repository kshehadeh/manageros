'use client'

import Link from 'next/link'
import { MeetingDataTable } from '@/components/meetings/data-table'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Button } from '@/components/ui/button'
import { Plus, Calendar } from 'lucide-react'
import { HelpIcon } from '@/components/help-icon'

export function MeetingsPageClient() {
  return (
    <PageContainer>
      <PageHeader
        title='Meetings'
        titleIcon={Calendar}
        subtitle={
          <>
            <div className='flex items-center gap-2 mb-1'>
              <HelpIcon helpId='meetings' size='md' />
            </div>
            <p>Manage and track your organization&apos;s meetings</p>
          </>
        }
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
