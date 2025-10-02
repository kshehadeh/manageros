import { getMeetings } from '@/lib/actions'
import { MeetingsPageClient } from '@/components/meetings/meetings-page-client'
import { requireAuth } from '@/lib/auth-utils'

export default async function MeetingsPage() {
  await requireAuth({ requireOrganization: true })

  const meetings = await getMeetings()

  return <MeetingsPageClient meetings={meetings} />
}
