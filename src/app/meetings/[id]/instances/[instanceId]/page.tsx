import { getMeetingInstance } from '@/lib/actions/meeting-instance'
import { getEntityLinks } from '@/lib/actions/entity-links'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { Calendar, StickyNote } from 'lucide-react'
import { MeetingInstanceDetailBreadcrumbClient } from '@/components/meetings/meeting-instance-detail-breadcrumb-client'
import { MeetingInstanceActionsDropdown } from '@/components/meetings/meeting-instance-actions-dropdown'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { LinkManager } from '@/components/entity-links'
import { HelpIcon } from '@/components/help-icon'
import { MeetingParticipantsSidebar } from '@/components/meetings/meeting-participants-sidebar'
import { SectionHeader } from '@/components/ui/section-header'

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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
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
                {isPast && <span>Past Instance</span>}
                <span>
                  {attendedCount}/{totalParticipants} attended
                </span>
              </div>
            </div>
            <MeetingInstanceActionsDropdown
              meetingId={meetingInstance.meetingId}
              instanceId={meetingInstance.id}
            />
          </div>
        </div>

        {/* Main Content and Sidebar */}
        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Main Content */}
          <div className='flex-1 min-w-0'>
            <div className='space-y-6'>
              {/* Notes section */}
              <div className='page-section'>
                <SectionHeader icon={StickyNote} title='Notes' />
                <ReadonlyNotesField
                  content={meetingInstance.notes || ''}
                  variant='default'
                  emptyStateText='No notes for this meeting instance'
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Full width on mobile, fixed width on desktop */}
          <div className='w-full lg:w-80 lg:flex-shrink-0'>
            <div className='page-section'>
              <MeetingParticipantsSidebar
                participants={meetingInstance.participants}
              />
            </div>
            <div className='page-section mt-6'>
              <LinkManager
                entityType='MeetingInstance'
                entityId={meetingInstance.id}
                links={entityLinks}
              />
            </div>
          </div>
        </div>
      </div>
    </MeetingInstanceDetailBreadcrumbClient>
  )
}
