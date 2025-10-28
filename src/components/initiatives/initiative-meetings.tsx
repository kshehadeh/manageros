'use client'

import { MeetingListWithData } from '@/components/meetings/meeting-list-with-data'
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
  currentTeam?: { id: string; name: string } | null
}

export function InitiativeMeetings({
  meetings,
  initiativeId,
  currentTeam,
}: InitiativeMeetingsProps) {
  return (
    <MeetingListWithData
      initiativeId={initiativeId}
      meetings={meetings}
      currentTeam={currentTeam}
    />
  )
}
