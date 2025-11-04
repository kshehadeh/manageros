import { MeetingsPageClient } from '@/components/meetings/meetings-page-client'
import { requireAuth } from '@/lib/auth-utils'

export default async function MeetingsPage() {
  await requireAuth({ requireOrganization: true })

  return <MeetingsPageClient />
}
