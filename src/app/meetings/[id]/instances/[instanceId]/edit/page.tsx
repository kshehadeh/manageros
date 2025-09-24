import { getMeetingInstance, getPeople } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { MeetingInstanceEditClient } from '@/components/meeting-instance-edit-client'

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
    scheduledAt: new Date(meetingInstance.scheduledAt)
      .toISOString()
      .slice(0, 16), // Format for datetime-local input
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
