import { getMeeting } from '@/lib/actions/meeting'
import { getTeams } from '@/lib/actions/team'

import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { MeetingForm } from '@/components/meetings/meeting-form'
import { utcToLocalDateTimeString } from '@/lib/timezone-utils'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'

export default async function EditMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  const { id } = await params

  if (!(await getActionPermission(user, 'meeting.edit', id))) {
    redirect('/dashboard')
  }

  const [meeting, teams] = await Promise.all([getMeeting(id), getTeams()])

  if (!meeting) {
    notFound()
  }

  // Format the meeting data for the form
  const initialData = {
    title: meeting.title,
    description: meeting.description || '',
    scheduledAt: utcToLocalDateTimeString(meeting.scheduledAt), // Convert UTC to local time for datetime-local input
    duration: meeting.duration || undefined,
    location: meeting.location || '',
    notes: meeting.notes || '',
    isRecurring: meeting.isRecurring || false,
    recurrenceType: meeting.recurrenceType as
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'bi_monthly'
      | 'semi_annually'
      | undefined,
    teamId: meeting.teamId || 'none',
    initiativeId: meeting.initiativeId || 'none',
    ownerId: meeting.ownerId || 'none',
    participants: meeting.participants.map(p => ({
      personId: p.personId,
      status: p.status as 'invited' | 'accepted' | 'declined' | 'tentative',
    })),
  }

  return (
    <div className='space-y-6'>
      <MeetingForm
        teams={teams}
        initialData={initialData}
        isEditing={true}
        meetingId={meeting.id}
        header={{
          title: 'Edit Meeting',
          subtitle: 'Update meeting details and participants',
        }}
      />
    </div>
  )
}
