import { getMeetingInstance } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import { Calendar, Users } from 'lucide-react'
import { MeetingDetailBreadcrumbClient } from '@/components/meeting-detail-breadcrumb-client'
import { MeetingInstanceActionsDropdown } from '@/components/meeting-instance-actions-dropdown'

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
  const meetingInstance = await getMeetingInstance(instanceId)

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
    <MeetingDetailBreadcrumbClient
      meetingTitle={meetingInstance.meeting.title}
      meetingId={meetingInstance.meetingId}
    >
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <h1 className='page-title'>{meetingInstance.meeting.title}</h1>
              <p className='page-subtitle'>Meeting Instance</p>
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

        <div className='page-section'>
          <h2 className='text-lg font-semibold mb-4'>Instance Details</h2>
          <div className='grid gap-6 md:grid-cols-2'>
            <div className='space-y-4'>
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

              {meetingInstance.notes && (
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Notes:
                  </span>
                  <div className='mt-1 text-sm'>{meetingInstance.notes}</div>
                </div>
              )}
            </div>

            <div className='space-y-4'>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>
                  Created:
                </span>
                <div className='mt-1 text-sm'>
                  {new Date(meetingInstance.createdAt).toLocaleString()}
                </div>
              </div>

              <div>
                <span className='text-sm font-medium text-muted-foreground'>
                  Last Updated:
                </span>
                <div className='mt-1 text-sm'>
                  {new Date(meetingInstance.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
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

        <div className='page-section'>
          <div className='flex items-center gap-3'>
            <Button asChild variant='outline'>
              <Link
                href={`/meetings/${meetingInstance.meetingId}`}
                className='flex items-center gap-2'
              >
                <Calendar className='w-4 h-4' />
                Back to Meeting
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </MeetingDetailBreadcrumbClient>
  )
}
