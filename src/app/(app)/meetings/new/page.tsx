import { getTeams } from '@/lib/actions/team'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MeetingForm } from '@/components/meetings/meeting-form'

export default async function NewMeetingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const teams = await getTeams()

  return (
    <div className='space-y-6'>
      <MeetingForm teams={teams} showHeader />
    </div>
  )
}
