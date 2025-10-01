'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MeetingsTable } from '@/components/meetings-table'
import { MeetingsFilterBar } from '@/components/meetings-filter-bar'
import { Button } from '@/components/ui/button'
import { Plus, Calendar } from 'lucide-react'
import {
  Meeting,
  Team,
  Initiative,
  Person,
  User as PrismaUser,
} from '@prisma/client'
import { HelpIcon } from '@/components/help-icon'

type MeetingWithRelations = Meeting & {
  team: Team | null
  initiative: Initiative | null
  owner: Person | null
  createdBy: PrismaUser | null
  participants: Array<{
    person: Person
    status: string
  }>
}

interface MeetingsPageClientProps {
  meetings: MeetingWithRelations[]
}

export function MeetingsPageClient({ meetings }: MeetingsPageClientProps) {
  const [filteredMeetings, setFilteredMeetings] =
    useState<MeetingWithRelations[]>(meetings)

  // Update filtered meetings when meetings prop changes
  useEffect(() => {
    setFilteredMeetings(meetings)
  }, [meetings])

  const handleFilteredMeetingsChange = useCallback(
    (newFilteredMeetings: MeetingWithRelations[]) => {
      setFilteredMeetings(newFilteredMeetings)
    },
    []
  )

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
        <MeetingsFilterBar
          meetings={meetings}
          onFilteredMeetingsChange={handleFilteredMeetingsChange}
        />

        <MeetingsTable
          meetings={meetings}
          filteredMeetings={filteredMeetings}
        />
      </div>
    </div>
  )
}
