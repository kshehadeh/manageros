import { getMeeting, getPeople } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import { MeetingDetailBreadcrumbClient } from '@/components/meeting-detail-breadcrumb-client'
import { MeetingInstanceList } from '@/components/meeting-instance-list'
import { MeetingActionsDropdown } from '@/components/meeting-actions-dropdown'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  Building2,
  Target,
  Repeat,
} from 'lucide-react'

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const { id } = await params
  const [meeting, people] = await Promise.all([getMeeting(id), getPeople()])

  if (!meeting) {
    notFound()
  }

  const scheduledDate = new Date(meeting.scheduledAt)
  const isPast = scheduledDate < new Date()

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'No duration set'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0
        ? `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`
        : `${hours} hour${hours !== 1 ? 's' : ''}`
    }
    return `${mins} minute${mins !== 1 ? 's' : ''}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <MeetingDetailBreadcrumbClient
      meetingTitle={meeting.title}
      meetingId={meeting.id}
    >
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-start justify-between'>
            <div>
              <h1 className='page-title'>{meeting.title}</h1>
              <div className='flex items-center gap-3 mt-2'>
                {isPast && <Badge variant='secondary'>Past Meeting</Badge>}
                {meeting.isRecurring && (
                  <Badge variant='outline' className='flex items-center gap-1'>
                    <Repeat className='h-3 w-3' />
                    {meeting.recurrenceType?.replace('_', '-')}
                  </Badge>
                )}
                <Badge variant='outline'>
                  {meeting.participants.length} participant
                  {meeting.participants.length !== 1 ? 's' : ''}
                </Badge>
                {meeting.isRecurring && meeting.instances.length > 0 && (
                  <Badge variant='outline'>
                    {meeting.instances.length} instance
                    {meeting.instances.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            <MeetingActionsDropdown meetingId={meeting.id} meeting={meeting} />
          </div>
        </div>

        {/* Meeting Details */}
        <div className='page-section'>
          <h2 className='page-section-title'>Meeting Details</h2>
          <div className='card-grid'>
            <div className='space-y-4'>
              {meeting.description && (
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Description:
                  </span>
                  <div className='mt-1 text-sm'>{meeting.description}</div>
                </div>
              )}

              <div>
                <span className='text-sm font-medium text-muted-foreground'>
                  Scheduled:
                </span>
                <div className='mt-1 flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  <span className='text-sm'>
                    {formatDateTime(scheduledDate)}
                  </span>
                </div>
              </div>

              <div>
                <span className='text-sm font-medium text-muted-foreground'>
                  Duration:
                </span>
                <div className='mt-1 flex items-center gap-2'>
                  <Clock className='h-4 w-4' />
                  <span className='text-sm'>
                    {formatDuration(meeting.duration)}
                  </span>
                </div>
              </div>

              {meeting.location && (
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Location:
                  </span>
                  <div className='mt-1 flex items-center gap-2'>
                    <MapPin className='h-4 w-4' />
                    <span className='text-sm'>{meeting.location}</span>
                  </div>
                </div>
              )}

              {meeting.owner && (
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Owner:
                  </span>
                  <div className='mt-1 flex items-center gap-2'>
                    <User className='h-4 w-4' />
                    <Link
                      href={`/people/${meeting.owner.id}`}
                      className='link-hover'
                    >
                      {meeting.owner.name}
                    </Link>
                  </div>
                </div>
              )}

              {meeting.isRecurring && (
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Recurrence:
                  </span>
                  <div className='mt-1 flex items-center gap-2'>
                    <Repeat className='h-4 w-4' />
                    <span className='text-sm capitalize'>
                      {meeting.recurrenceType?.replace('_', '-')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className='space-y-4'>
              {meeting.team && (
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Team:
                  </span>
                  <div className='mt-1 flex items-center gap-2'>
                    <Building2 className='h-4 w-4' />
                    <Link
                      href={`/teams/${meeting.team.id}`}
                      className='link-hover'
                    >
                      {meeting.team.name}
                    </Link>
                  </div>
                </div>
              )}

              {meeting.initiative && (
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Initiative:
                  </span>
                  <div className='mt-1 flex items-center gap-2'>
                    <Target className='h-4 w-4' />
                    <Link
                      href={`/initiatives/${meeting.initiative.id}`}
                      className='link-hover'
                    >
                      {meeting.initiative.title}
                    </Link>
                  </div>
                </div>
              )}

              <div>
                <span className='text-sm font-medium text-muted-foreground'>
                  Created:
                </span>
                <div className='mt-1 text-sm'>
                  {new Date(meeting.createdAt).toLocaleString()}
                </div>
              </div>

              <div>
                <span className='text-sm font-medium text-muted-foreground'>
                  Created By:
                </span>
                <div className='mt-1 text-sm'>{meeting.createdBy.name}</div>
              </div>

              <div>
                <span className='text-sm font-medium text-muted-foreground'>
                  Last Updated:
                </span>
                <div className='mt-1 text-sm'>
                  {new Date(meeting.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        {meeting.participants.length > 0 && (
          <div className='page-section'>
            <h2 className='page-section-title flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Participants
            </h2>
            <div className='space-y-3'>
              {meeting.participants.map(participant => (
                <div
                  key={participant.id}
                  className='flex items-center justify-between'
                >
                  <div className='flex items-center gap-3'>
                    <Link
                      href={`/people/${participant.person.id}`}
                      className='link-hover'
                    >
                      {participant.person.name}
                    </Link>
                  </div>
                  <Badge className={getStatusColor(participant.status)}>
                    {participant.status.charAt(0).toUpperCase() +
                      participant.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className='page-section'>
          <h2 className='page-section-title'>Notes</h2>
          <ReadonlyNotesField
            content={meeting.notes || ''}
            variant='default'
            emptyStateText='No notes for this meeting'
          />
        </div>

        {/* Meeting Instances - Only show for recurring meetings */}
        {meeting.isRecurring && (
          <div className='page-section'>
            <MeetingInstanceList
              instances={meeting.instances}
              meetingId={meeting.id}
              people={people}
            />
          </div>
        )}
      </div>
    </MeetingDetailBreadcrumbClient>
  )
}
