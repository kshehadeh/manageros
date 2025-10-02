import { getMeetingInstance } from '@/lib/actions'
import { getEntityLinks } from '@/lib/actions/entity-links'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import { Calendar, Users } from 'lucide-react'
import { MeetingInstanceDetailBreadcrumbClient } from '@/components/meetings/meeting-instance-detail-breadcrumb-client'
import { MeetingInstanceActionsDropdown } from '@/components/meetings/meeting-instance-actions-dropdown'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { LinkManager } from '@/components/entity-links'
import { HelpIcon } from '@/components/help-icon'

export default async function MeetingInstanceDetailPage({
  params,
}: {
  params: Promise<{ id: string; instanceId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const { instanceId } = await params
  const [meetingInstance, entityLinks] = await Promise.all([
    getMeetingInstance(instanceId),
    getEntityLinks('MeetingInstance', instanceId),
  ])

  if (!meetingInstance) {
    notFound()
  }

  const scheduledDate = new Date(meetingInstance.scheduledAt)
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

  const attendedCount = meetingInstance.participants.filter(
    p => p.status === 'attended'
  ).length
  const totalParticipants = meetingInstance.participants.length

  return (
    <MeetingInstanceDetailBreadcrumbClient
      meetingTitle={meetingInstance.meeting.title}
      meetingId={meetingInstance.meetingId}
      instanceId={meetingInstance.id}
    >
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <h1 className='page-title'>{meetingInstance.meeting.title}</h1>
                <HelpIcon helpId='meeting-instances' size='md' />
              </div>
              <p className='page-subtitle'>Meeting Instance</p>

              {/* Instance details in header */}
              <div className='flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Calendar className='h-3 w-3' />
                  <span>{formatDateTime(scheduledDate)}</span>
                </div>
              </div>

              <div className='flex items-center gap-3 mt-2'>
                {isPast && <Badge variant='secondary'>Past Instance</Badge>}
                <Badge variant='outline'>
                  {attendedCount}/{totalParticipants} attended
                </Badge>
              </div>
            </div>
            <MeetingInstanceActionsDropdown
              meetingId={meetingInstance.meetingId}
              instanceId={meetingInstance.id}
            />
          </div>
        </div>

        {/* Notes section */}
        <div className='page-section'>
          <ReadonlyNotesField
            content={meetingInstance.notes || ''}
            variant='default'
            emptyStateText='No notes for this meeting instance'
          />
        </div>

        {/* Links */}
        <div className='page-section'>
          <LinkManager
            entityType='MeetingInstance'
            entityId={meetingInstance.id}
            links={entityLinks}
          />
        </div>

        {meetingInstance.participants.length > 0 && (
          <div className='page-section'>
            <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Participants
            </h2>
            <div className='space-y-3'>
              {meetingInstance.participants.map(participant => (
                <div
                  key={participant.id}
                  className='flex items-center justify-between'
                >
                  <div className='flex items-center gap-3'>
                    <Link
                      href={`/people/${participant.person.id}`}
                      className='text-blue-600 hover:text-blue-800 font-medium'
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
      </div>
    </MeetingInstanceDetailBreadcrumbClient>
  )
}
