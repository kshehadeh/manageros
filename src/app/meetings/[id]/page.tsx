import { getMeeting, getPeople } from '@/lib/actions'
import { getEntityLinks } from '@/lib/actions/entity-links'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import { MeetingDetailBreadcrumbClient } from '@/components/meetings/meeting-detail-breadcrumb-client'
import { MeetingInstanceList } from '@/components/meetings/meeting-instance-list'
import { MeetingActionsDropdown } from '@/components/meetings/meeting-actions-dropdown'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { LinkManager } from '@/components/entity-links'
import {
  Clock,
  Users,
  User,
  Building2,
  Repeat,
  FileText,
  StickyNote,
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
  const [meeting, people, entityLinks] = await Promise.all([
    getMeeting(id),
    getPeople(),
    getEntityLinks('Meeting', id),
  ])

  if (!meeting) {
    notFound()
  }

  const scheduledDate = new Date(meeting.scheduledAt)
  const isPast = scheduledDate < new Date()

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
                {isPast && !meeting.isRecurring && (
                  <Badge variant='secondary'>Past Meeting</Badge>
                )}
                {meeting.isRecurring && (
                  <Badge variant='outline' className='flex items-center gap-1'>
                    <Repeat className='h-3 w-3' />
                    {meeting.recurrenceType?.replace('_', '-')}
                  </Badge>
                )}
                <Badge variant='outline' className='flex items-center gap-1'>
                  <Clock className='h-3 w-3' />
                  {formatDuration(meeting.duration)}
                </Badge>
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
                {meeting.owner && (
                  <Badge variant='outline' className='flex items-center gap-1'>
                    <User className='h-3 w-3' />
                    <Link
                      href={`/people/${meeting.owner.id}`}
                      className='link-hover'
                    >
                      {meeting.owner.name}
                    </Link>
                  </Badge>
                )}
                {meeting.team && (
                  <Badge variant='outline' className='flex items-center gap-1'>
                    <Building2 className='h-3 w-3' />
                    <Link
                      href={`/teams/${meeting.team.id}`}
                      className='link-hover'
                    >
                      {meeting.team.name}
                    </Link>
                  </Badge>
                )}
              </div>
            </div>
            <MeetingActionsDropdown meetingId={meeting.id} meeting={meeting} />
          </div>
        </div>

        {/* Description */}
        {meeting.description && (
          <div className='page-section'>
            <h2 className='page-section-title font-bold flex items-center gap-2'>
              <FileText className='w-4 h-4' />
              Description
            </h2>
            <ReadonlyNotesField
              content={meeting.description}
              variant='default'
              showEmptyState={false}
            />
          </div>
        )}

        {/* Participants */}
        {meeting.participants.length > 0 && (
          <div className='page-section'>
            <h2 className='page-section-title font-bold flex items-center gap-2'>
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
          <h2 className='page-section-title font-bold flex items-center gap-2'>
            <StickyNote className='w-4 h-4' />
            Notes
          </h2>
          <ReadonlyNotesField
            content={meeting.notes || ''}
            variant='default'
            emptyStateText='No notes for this meeting'
          />
        </div>

        {/* Links */}
        <div className='page-section'>
          <LinkManager
            entityType='Meeting'
            entityId={meeting.id}
            links={entityLinks}
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
