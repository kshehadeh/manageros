'use client'

import { MeetingListWithData } from '@/components/meetings/meeting-list-with-data'
import {
  Meeting,
  Team,
  Initiative,
  Person,
  User as PrismaUser,
} from '@prisma/client'
import { SectionHeader } from '@/components/ui/section-header'
import { Calendar } from 'lucide-react'
import { CreateMeetingModal } from '@/components/initiatives/create-meeting-modal'

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
  currentTeam?: { id: string; name: string } | null
}

export function InitiativeMeetings({
  meetings,
  initiativeId,
  currentTeam,
}: InitiativeMeetingsProps) {
  return (
    <div className='rounded-xl py-4 space-y-4'>
      <SectionHeader
        icon={Calendar}
        title='Meetings'
        action={
          <CreateMeetingModal
            initiativeId={initiativeId}
            currentTeam={currentTeam}
          />
        }
      />
      <MeetingListWithData
        initiativeId={initiativeId}
        meetings={meetings}
        currentTeam={currentTeam}
      />
    </div>
  )
}
