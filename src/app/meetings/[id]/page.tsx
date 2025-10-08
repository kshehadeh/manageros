import { getMeeting } from '@/lib/actions/meeting'
import { getPeople } from '@/lib/actions/person'
import { getEntityLinks } from '@/lib/actions/entity-links'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from '@/components/ui/section-header'
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
  Calendar,
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
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <Calendar className='h-6 w-6 text-muted-foreground' />
                <h1 className='page-title'>{meeting.title}</h1>
              </div>

              {/* Meeting details in small text */}
              <div className='flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Clock className='h-4 w-4' />
                  <span>{formatDuration(meeting.duration)}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <Users className='h-4 w-4' />
                  <span>
                    {meeting.participants.length} participant
                    {meeting.participants.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {meeting.isRecurring && (
                  <div className='flex items-center gap-1'>
                    <Repeat className='h-4 w-4' />
                    <span>{meeting.recurrenceType?.replace('_', '-')}</span>
                  </div>
                )}
                {meeting.isRecurring && meeting.instances.length > 0 && (
                  <span>
                    {meeting.instances.length} instance
                    {meeting.instances.length !== 1 ? 's' : ''}
                  </span>
                )}
                {meeting.owner && (
                  <div className='flex items-center gap-1'>
                    <User className='h-4 w-4' />
                    <Link
                      href={`/people/${meeting.owner.id}`}
                      className='hover:text-primary transition-colors'
                    >
                      {meeting.owner.name}
                    </Link>
                  </div>
                )}
                {meeting.team && (
                  <div className='flex items-center gap-1'>
                    <Building2 className='h-4 w-4' />
                    <Link
                      href={`/teams/${meeting.team.id}`}
                      className='hover:text-primary transition-colors'
                    >
                      {meeting.team.name}
                    </Link>
                  </div>
                )}
                {isPast && !meeting.isRecurring && (
                  <span className='text-muted-foreground'>Past Meeting</span>
                )}
              </div>
            </div>
            <MeetingActionsDropdown meetingId={meeting.id} meeting={meeting} />
          </div>
        </div>

        {/* Main Content and Sidebar */}
        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Main Content */}
          <div className='flex-1 min-w-0'>
            <div className='space-y-6'>
              {/* Description */}
              {meeting.description && (
                <div className='page-section'>
                  <SectionHeader icon={FileText} title='Description' />
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
                  <SectionHeader icon={Users} title='Participants' />
                  <div className='space-y-3'>
                    {meeting.participants.map(participant => (
                      <div
                        key={participant.id}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-3'>
                          <Link
                            href={`/people/${participant.person.id}`}
                            className='hover:text-primary transition-colors'
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
                <SectionHeader icon={StickyNote} title='Notes' />
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
          </div>

          {/* Right Sidebar - Full width on mobile, fixed width on desktop */}
          <div className='w-full lg:w-80 lg:flex-shrink-0'>
            <div className='page-section'>
              <LinkManager
                entityType='Meeting'
                entityId={meeting.id}
                links={entityLinks}
              />
            </div>
          </div>
        </div>
      </div>
    </MeetingDetailBreadcrumbClient>
  )
}
