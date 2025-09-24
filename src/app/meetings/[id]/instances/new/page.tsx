import { getMeeting, getPeople } from '@/lib/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { MeetingInstanceForm } from '@/components/meeting-instance-form'

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
  const [meeting, people] = await Promise.all([getMeeting(id), getPeople()])

  if (!meeting) {
    notFound()
  }

  if (!meeting.isRecurring) {
    redirect(`/meetings/${id}`)
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Create New Instance</h1>
        <p className='text-muted-foreground'>
          Add a new instance for &ldquo;{meeting.title}&rdquo;
        </p>
      </div>

      <div className='max-w-2xl'>
        <MeetingInstanceForm meetingId={meeting.id} people={people} />
      </div>
    </div>
  )
}
