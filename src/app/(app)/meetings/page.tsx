import { MeetingsPageClient } from '@/components/meetings/meetings-page-client'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'

export default async function MeetingsPage() {
  const user = await getCurrentUser()
  const canCreateMeetings = isAdminOrOwner(user) || !!user.personId

  return <MeetingsPageClient canCreateMeetings={canCreateMeetings} />
}
