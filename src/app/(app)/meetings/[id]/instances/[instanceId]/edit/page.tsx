import { getMeetingInstance } from '@/lib/actions/meeting-instance'
import { getMeeting } from '@/lib/actions/meeting'

import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { MeetingInstanceEditClient } from '@/components/meetings/meeting-instance-edit-client'
import { utcToLocalDateTimeString } from '@/lib/timezone-utils'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'

export default async function EditMeetingInstancePage({
  params,
}: {
  params: Promise<{ id: string; instanceId: string }>
}) {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    redirect('/organization/create')
  }

  const { id, instanceId } = await params
  const [meetingInstance, parentMeeting] = await Promise.all([
    getMeetingInstance(instanceId),
    getMeeting(id),
  ])

  if (!meetingInstance || !parentMeeting) {
    notFound()
  }

  // Check if user can edit the meeting (required to edit instances)
  const canEdit = await getActionPermission(
    user,
    'meeting.edit',
    parentMeeting.id
  )
  if (!canEdit) {
    redirect(`/meetings/${id}`)
  }

  // Format the instance data for the form
  const initialData = {
    meetingId: meetingInstance.meetingId,
    scheduledAt: utcToLocalDateTimeString(meetingInstance.scheduledAt), // Convert UTC to local time for datetime-local input
    notes: meetingInstance.notes || '',
    participants: meetingInstance.participants.map(p => ({
      personId: p.personId,
      status: p.status as
        | 'invited'
        | 'accepted'
        | 'declined'
        | 'tentative'
        | 'attended'
        | 'absent',
    })),
  }

  return (
    <MeetingInstanceEditClient
      meetingId={id}
      instanceId={instanceId}
      meetingTitle={meetingInstance.meeting.title}
      initialData={initialData}
      meetingInstanceId={meetingInstance.id}
      parentMeetingParticipants={parentMeeting.participants}
    />
  )
}
