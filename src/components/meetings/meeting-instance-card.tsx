import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  MeetingInstance,
  Person,
  MeetingInstanceParticipant,
} from '@prisma/client'
import { Calendar, Users } from 'lucide-react'

type MeetingInstanceWithRelations = MeetingInstance & {
  participants: (MeetingInstanceParticipant & {
    person: Person
  })[]
}

interface MeetingInstanceCardProps {
  instance: MeetingInstanceWithRelations
  meetingId: string
}

export function MeetingInstanceCard({ instance }: MeetingInstanceCardProps) {
  const scheduledDate = new Date(instance.scheduledAt)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended':
        return 'bg-green-100 text-green-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'accepted':
        return 'bg-blue-100 text-blue-800'
      case 'declined':
        return 'bg-gray-100 text-gray-800'
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const attendedCount = instance.participants.filter(
    p => p.status === 'attended'
  ).length
  const totalParticipants = instance.participants.length

  return (
    <Card className='p-4 hover:bg-accent/50 transition-colors'>
      <div className='space-y-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4 text-muted-foreground' />
            <span className='font-medium text-sm'>
              {formatDateTime(scheduledDate)}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            {isPast && (
              <Badge variant='secondary' className='text-xs'>
                Past
              </Badge>
            )}
            {totalParticipants > 0 && (
              <Badge variant='outline' className='text-xs'>
                {attendedCount}/{totalParticipants} attended
              </Badge>
            )}
          </div>
        </div>

        {instance.notes && (
          <p className='text-sm text-muted-foreground line-clamp-2'>
            {instance.notes}
          </p>
        )}

        {instance.participants.length > 0 && (
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Users className='h-4 w-4' />
              <span>
                {instance.participants.length} participant
                {instance.participants.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className='flex flex-wrap gap-1'>
              {instance.participants.map(participant => (
                <Badge
                  key={participant.id}
                  className={`text-xs ${getStatusColor(participant.status)}`}
                >
                  {participant.person.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
