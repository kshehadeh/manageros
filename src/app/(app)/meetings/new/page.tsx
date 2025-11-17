import { getTeams } from '@/lib/actions/team'

import { redirect } from 'next/navigation'
import { MeetingForm } from '@/components/meetings/meeting-form'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'

export default async function NewMeetingPage() {
  const user = await getCurrentUser()

  if (!(await getActionPermission(user, 'meeting.create'))) {
    redirect('/dashboard')
  }

  const teams = await getTeams()

  return (
    <div className='space-y-6'>
      <MeetingForm teams={teams} showHeader />
    </div>
  )
}
