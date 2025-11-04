import { PeoplePageClient } from '@/components/people/people-page-client'
import { Suspense } from 'react'
import { RequireAuthServer } from '@/components/auth/require-auth-server'

export default function PeoplePage() {
  return (
    <Suspense fallback={<div className='page-container'>Loading...</div>}>
      <RequireAuthServer requireOrganization={true}>
        <PeoplePageClient />
      </RequireAuthServer>
    </Suspense>
  )
}
