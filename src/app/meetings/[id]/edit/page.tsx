import { getMeeting } from '@/lib/actions/meeting'
import { getTeams } from '@/lib/actions/team'
import { getInitiatives } from '@/lib/actions/initiative'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { MeetingForm } from '@/components/meetings/meeting-form'
import { utcToLocalDateTimeString } from '@/lib/timezone-utils'

export default async function EditMeetingPage({
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
  const [meeting, teams, initiatives] = await Promise.all([
    getMeeting(id),
    getTeams(),
    getInitiatives(),
  ])

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
      <div>
        <h1 className='text-2xl font-bold'>Edit Meeting</h1>
        <p className='text-muted-foreground'>
          Update meeting details and participants
        </p>
      </div>

      <MeetingForm
        teams={teams}
        initiatives={initiatives}
        initialData={initialData}
        isEditing={true}
        meetingId={meeting.id}
      />
    </div>
  )
}
