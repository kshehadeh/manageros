'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SharedMeetingsTable } from '@/components/meetings/shared-meetings-table'
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
}

export function InitiativeMeetings({
  meetings,
  initiativeId,
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
      <h3 className='section-header font-bold flex items-center gap-2'>
        <Calendar className='w-4 h-4' />
        Meetings
      </h3>
      <SharedMeetingsTable
        meetings={meetings}
        variant='initiative'
        initiativeId={initiativeId}
        showCreateButton={true}
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
