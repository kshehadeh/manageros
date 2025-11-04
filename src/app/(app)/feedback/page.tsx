import { FeedbackPageClient } from '@/components/feedback/feedback-page-client'
import { Suspense } from 'react'
import { RequireAuthServer } from '@/components/auth/require-auth-server'

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className='page-container'>Loading...</div>}>
      <RequireAuthServer requireOrganization={true}>
        <FeedbackPageClient />
      </RequireAuthServer>
    </Suspense>
  )
}
