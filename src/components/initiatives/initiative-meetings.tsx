'use client'

import { SharedMeetingsTable } from '@/components/meetings/shared-meetings-table'
import { SectionHeader } from '@/components/ui/section-header'
import { CreateMeetingModal } from './create-meeting-modal'
import {
  Meeting,
  Team,
  Initiative,
  Person,
  User as PrismaUser,
} from '@prisma/client'
import { Calendar } from 'lucide-react'

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

interface InitiativeMeetingsProps {
  meetings: MeetingWithRelations[]
  initiativeId: string
  people: Array<{ id: string; name: string; email?: string | null }>
  teams: Array<{ id: string; name: string }>
  currentTeam?: { id: string; name: string } | null
}

export function InitiativeMeetings({
  meetings,
  initiativeId,
  people,
  teams,
  currentTeam,
}: InitiativeMeetingsProps) {
  return (
    <div className='page-section'>
      <SectionHeader
        icon={Calendar}
        title='Meetings'
        action={
          <CreateMeetingModal
            initiativeId={initiativeId}
            people={people}
            teams={teams}
            currentTeam={currentTeam}
          />
        }
        className='mb-4'
      />
      <SharedMeetingsTable
        meetings={meetings}
        emptyStateMessage='No meetings for this initiative'
      />
    </div>
  )
}
