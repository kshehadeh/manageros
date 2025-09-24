import { redirect } from 'next/navigation'
import { getMeetings } from '@/lib/actions'
import { MeetingsPageClient } from '@/components/meetings-page-client'
import { getCurrentUser } from '@/lib/auth-utils'

export default async function MeetingsPage() {
  try {
    await getCurrentUser()
  } catch {
    redirect('/auth/signin')
  }

  const meetings = await getMeetings()

  return <MeetingsPageClient meetings={meetings} />
}
