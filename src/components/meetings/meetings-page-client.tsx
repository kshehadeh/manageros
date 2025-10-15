'use client'

import Link from 'next/link'
import { MeetingDataTable } from '@/components/meetings/data-table'
import { Button } from '@/components/ui/button'
import { Plus, Calendar } from 'lucide-react'
import { HelpIcon } from '@/components/help-icon'

export function MeetingsPageClient() {
  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <Calendar className='h-6 w-6 text-muted-foreground' />
              <h1 className='page-title'>Meetings</h1>
              <HelpIcon helpId='meetings' size='md' />
            </div>
            <p className='page-subtitle'>
              Manage and track your organization&apos;s meetings
            </p>
          </div>
          <Button asChild variant='outline'>
            <Link href='/meetings/new' className='flex items-center gap-2'>
              <Plus className='h-4 w-4' />
              New Meeting
            </Link>
          </Button>
        </div>
      </div>

      <div className='page-section'>
        <MeetingDataTable
          settingsId='meetings-list'
          enablePagination={true}
          limit={20}
        />
      </div>
    </div>
  )
}
