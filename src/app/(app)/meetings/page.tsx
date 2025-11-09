import { MeetingsPageClient } from '@/components/meetings/meetings-page-client'
import { getCurrentUser } from '@/lib/auth-utils'

export default async function MeetingsPage() {
  const user = await getCurrentUser()
  const canCreateMeetings = user.role === 'ADMIN' || !!user.personId

  return <MeetingsPageClient canCreateMeetings={canCreateMeetings} />
}
