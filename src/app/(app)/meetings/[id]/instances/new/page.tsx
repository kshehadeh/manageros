import { getMeeting } from '@/lib/actions/meeting'

import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { MeetingInstanceForm } from '@/components/meetings/meeting-instance-form'
import { NewMeetingInstanceBreadcrumbClient } from '@/components/meetings/new-meeting-instance-breadcrumb-client'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'

export default async function NewMeetingInstancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    redirect('/organization/create')
  }

  const { id } = await params
  const meeting = await getMeeting(id)

  if (!meeting) {
    notFound()
  }

  if (!meeting.isRecurring) {
    redirect(`/meetings/${id}`)
  }

  // Check if user can create meeting instances
  const canCreate = await getActionPermission(user, 'meeting-instance.create')
  if (!canCreate) {
    redirect(`/meetings/${id}`)
  }

  // Also check if user can edit the meeting (required to create instances)
  const canEdit = await getActionPermission(user, 'meeting.edit', meeting.id)
  if (!canEdit) {
    redirect(`/meetings/${id}`)
  }

  // Transform parent meeting participants to initial data format
  const initialParticipants = meeting.participants.map(p => ({
    personId: p.personId,
    status: 'invited' as const, // Reset status to invited for new instance
  }))

  // Set default date to today with time from parent meeting
  const parentMeetingDate = new Date(meeting.scheduledAt)
  const todayWithParentTime = new Date()
  todayWithParentTime.setHours(parentMeetingDate.getHours())
  todayWithParentTime.setMinutes(parentMeetingDate.getMinutes())
  todayWithParentTime.setSeconds(0)
  todayWithParentTime.setMilliseconds(0)

  // Format as ISO string for the natural language date picker
  const defaultScheduledAt = todayWithParentTime.toISOString()

  return (
    <NewMeetingInstanceBreadcrumbClient
      meetingTitle={meeting.title}
      meetingId={meeting.id}
    >
      <PageContainer>
        <PageHeader
          title='Create New Instance'
          subtitle={`Add a new instance for "${meeting.title}"`}
        />

        <PageContent>
          <MeetingInstanceForm
            meetingId={meeting.id}
            initialData={{
              participants: initialParticipants,
              scheduledAt: defaultScheduledAt,
            }}
          />
        </PageContent>
      </PageContainer>
    </NewMeetingInstanceBreadcrumbClient>
  )
}
