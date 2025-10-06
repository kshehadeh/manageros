import { getMeetingInstance } from '@/lib/actions/meeting-instance'
import { getPeople } from '@/lib/actions/person'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { MeetingInstanceEditClient } from '@/components/meetings/meeting-instance-edit-client'
import { utcToLocalDateTimeString } from '@/lib/timezone-utils'

export default async function EditMeetingInstancePage({
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

  const { id, instanceId } = await params
  const [meetingInstance, people] = await Promise.all([
    getMeetingInstance(instanceId),
    getPeople(),
  ])

  if (!meetingInstance) {
    notFound()
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
      people={people}
      initialData={initialData}
      meetingInstanceId={meetingInstance.id}
    />
  )
}
