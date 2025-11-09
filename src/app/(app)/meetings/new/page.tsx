import { getTeams } from '@/lib/actions/team'

import { redirect } from 'next/navigation'
import { MeetingForm } from '@/components/meetings/meeting-form'
import { getCurrentUser } from '@/lib/auth-utils'

export default async function NewMeetingPage() {
  const user = await getCurrentUser()

  if (!user.organizationId) {
    redirect('/organization/create')
  }

  // Check if user can create meetings (admin or has linked person)
  const canCreateMeetings = user.role === 'ADMIN' || !!user.personId
  if (!canCreateMeetings) {
    redirect('/meetings')
  }

  const teams = await getTeams()

  return (
    <div className='space-y-6'>
      <MeetingForm teams={teams} showHeader />
    </div>
  )
}
