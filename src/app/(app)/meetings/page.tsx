import { MeetingsPageClient } from '@/components/meetings/meetings-page-client'
import { Suspense } from 'react'
import { RequireAuthServer } from '@/components/auth/require-auth-server'

export default function MeetingsPage() {
  return (
    <Suspense fallback={<div className='page-container'>Loading...</div>}>
      <RequireAuthServer requireOrganization={true}>
        <MeetingsPageClient />
      </RequireAuthServer>
    </Suspense>
  )
}
