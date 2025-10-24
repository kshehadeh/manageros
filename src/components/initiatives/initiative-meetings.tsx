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
    <MeetingListWithData
      initiativeId={initiativeId}
      meetings={meetings}
      people={people}
      teams={teams}
      currentTeam={currentTeam}
    />
  )
}
