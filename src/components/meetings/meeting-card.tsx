import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Meeting,
  Person,
  Team,
  User,
  MeetingParticipant,
  MeetingInstance,
} from '@prisma/client'
import { Calendar, Clock, MapPin, Users, Repeat } from 'lucide-react'

type MeetingWithRelations = Meeting & {
  team: Team | null
  initiative: { id: string; title: string } | null
  owner: Person | null
  createdBy: User
  participants: (MeetingParticipant & {
    person: Person
  })[]
  instances: MeetingInstance[]
}

interface MeetingCardProps {
  meeting: MeetingWithRelations
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const scheduledDate = new Date(meeting.scheduledAt)
  const isPast = scheduledDate < new Date()

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return ''
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${mins}m`
  }

  return (
    <Link href={`/meetings/${meeting.id}`} className='block'>
      <Card className='p-4 hover:bg-accent/50 transition-colors'>
        <div className='space-y-3'>
          <div className='flex items-start justify-between'>
            <h3 className='font-semibold text-base leading-tight'>
              {meeting.title}
            </h3>
            <div className='flex items-center gap-1 ml-2'>
              {isPast && (
                <Badge variant='secondary' className='text-xs'>
                  Past
                </Badge>
              )}
              {meeting.isRecurring && (
                <Badge
                  variant='outline'
                  className='text-xs flex items-center gap-1'
                >
                  <Repeat className='h-3 w-3' />
                  {meeting.recurrenceType?.replace('_', '-')}
                </Badge>
              )}
            </div>
          </div>

          {meeting.description && (
            <p className='text-sm text-muted-foreground line-clamp-2'>
              {meeting.description}
            </p>
          )}

          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Calendar className='h-4 w-4' />
              <span>{formatDateTime(scheduledDate)}</span>
              {meeting.duration && (
                <>
                  <Clock className='h-4 w-4 ml-2' />
                  <span>{formatDuration(meeting.duration)}</span>
                </>
              )}
            </div>

            {meeting.location && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <MapPin className='h-4 w-4' />
                <span className='line-clamp-1'>{meeting.location}</span>
              </div>
            )}

            {meeting.participants.length > 0 && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Users className='h-4 w-4' />
                <span>
                  {meeting.participants.length} participant
                  {meeting.participants.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {meeting.isRecurring && meeting.instances.length > 0 && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Repeat className='h-4 w-4' />
                <span>
                  {meeting.instances.length} instance
                  {meeting.instances.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          <div className='flex flex-wrap gap-2'>
            {meeting.team && (
              <Badge variant='outline' className='text-xs'>
                {meeting.team.name}
              </Badge>
            )}
            {meeting.initiative && (
              <Badge variant='outline' className='text-xs'>
                {meeting.initiative.title}
              </Badge>
            )}
            {meeting.owner && (
              <Badge variant='outline' className='text-xs'>
                Owner: {meeting.owner.name}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
