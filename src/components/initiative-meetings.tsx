'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SharedMeetingsTable } from '@/components/shared-meetings-table'
import {
  Meeting,
  Team,
  Initiative,
  Person,
  User as PrismaUser,
} from '@prisma/client'

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
  )
}
