'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SharedMeetingsTable } from '@/components/meetings/shared-meetings-table'
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
  const router = useRouter()
  const [, startTransition] = useTransition()

  const handleCreateMeeting = () => {
    startTransition(() => {
      router.push(`/meetings/new?initiativeId=${initiativeId}`)
    })
  }

  return (
    <div className='page-section'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='section-header font-bold flex items-center gap-2'>
          <Calendar className='w-4 h-4' />
          Meetings
        </h3>
        <CreateMeetingModal
          initiativeId={initiativeId}
          people={people}
          teams={teams}
          currentTeam={currentTeam}
        />
      </div>
      <SharedMeetingsTable
        meetings={meetings}
        variant='initiative'
        initiativeId={initiativeId}
        showCreateButton={false}
        onCreateMeeting={handleCreateMeeting}
        emptyStateMessage='No meetings scheduled for this initiative'
        emptyStateAction={{
          label: 'Schedule First Meeting',
          onClick: handleCreateMeeting,
        }}
      />
    </div>
  )
}
