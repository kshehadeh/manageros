import { getMeeting } from '@/lib/actions/meeting'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { MeetingInstanceForm } from '@/components/meetings/meeting-instance-form'

export default async function NewMeetingInstancePage({
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
  const meeting = await getMeeting(id)

  if (!meeting) {
    notFound()
  }

  if (!meeting.isRecurring) {
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

  // Format as datetime-local input value (YYYY-MM-DDTHH:mm)
  const defaultScheduledAt = todayWithParentTime.toISOString().slice(0, 16)

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Create New Instance</h1>
        <p className='text-muted-foreground'>
          Add a new instance for &ldquo;{meeting.title}&rdquo;
        </p>
      </div>

      <div className='max-w-2xl'>
        <MeetingInstanceForm
          meetingId={meeting.id}
          initialData={{
            participants: initialParticipants,
            scheduledAt: defaultScheduledAt,
          }}
        />
      </div>
    </div>
  )
}
