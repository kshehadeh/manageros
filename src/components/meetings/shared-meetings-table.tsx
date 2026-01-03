'use client'

import { Meeting, Team, Person, User as PrismaUser } from '@/generated/prisma'

export type MeetingWithRelations = Meeting & {
  team: Team | null
  initiative: { id: string; title: string } | null
  owner: Person | null
  createdBy: PrismaUser | null
  participants: Array<{
    person: Person
    status: string
  }>
}

export type MeetingInstanceWithRelations = {
  id: string
  scheduledAt: Date
  notes: string | null
  meeting: {
    id: string
    title: string
    description: string | null
    duration: number | null
    location: string | null
    team: {
      id: string
      name: string
    } | null
    initiative: {
      id: string
      title: string
    } | null
    owner: {
      id: string
      name: string
    } | null
    participants: Array<{
      person: {
        id: string
        name: string
      }
    }>
  }
  participants: Array<{
    person: {
      id: string
      name: string
    }
  }>
}

export type UpcomingMeeting =
  | (MeetingWithRelations & { type: 'meeting' })
  | (MeetingInstanceWithRelations & { type: 'instance' })

// Column configuration types
export type MeetingColumnType =
  | 'title'
  | 'dateTime'
  | 'time'
  | 'scheduled'
  | 'duration'
  | 'team'
  | 'initiative'
  | 'participants'
  | 'actions'

export interface MeetingColumnConfig {
  type: MeetingColumnType
  header: string
  show?: boolean
  width?: string
}
